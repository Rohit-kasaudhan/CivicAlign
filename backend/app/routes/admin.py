import os
from datetime import datetime, timedelta

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import func

from app.extensions import db
from app.models.complaint import Complaint, ComplaintStatusHistory
from app.models.initiative import Initiative
from app.models.user import User
from app.models.verification import Verification
from app.services.gamification_service import award_points
from app.services.notification_service import create_notification

admin_bp = Blueprint('admin', __name__)


def _require_admin():
    """Return (user, error_response) — call site checks for error_response."""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user or user.role != 'admin':
        return None, (jsonify({'error': 'Admin access required'}), 403)
    return user, None


# ── Dashboard ─────────────────────────────────────────────────────────────────

@admin_bp.route('/dashboard', methods=['GET'])
@jwt_required()
def admin_dashboard():
    _, err = _require_admin()
    if err:
        return err

    total      = Complaint.query.count()
    pending    = Complaint.query.filter_by(status='under_review').count()
    approved   = Complaint.query.filter_by(status='approved').count()
    in_prog    = Complaint.query.filter_by(status='in_progress').count()
    resolved   = Complaint.query.filter_by(status='resolved').count()

    citizens   = db.session.query(func.count(func.distinct(Complaint.submitted_by))).scalar() or 0
    initiatives = Initiative.query.filter(Initiative.status.in_(['proposed', 'planning'])).count()

    # Priority queue — top 10 under_review by impact_score desc
    pq_rows = (
        Complaint.query
        .filter_by(status='under_review')
        .order_by(Complaint.impact_score.desc().nullslast())
        .limit(10)
        .all()
    )
    priority_queue = []
    for c in pq_rows:
        d = c.to_dict()
        d['submitter_name'] = c.user.full_name if c.user else 'Unknown'
        priority_queue.append(d)

    # Recent activity — last 10 status history entries across all complaints
    recent = (
        ComplaintStatusHistory.query
        .order_by(ComplaintStatusHistory.created_at.desc())
        .limit(10)
        .all()
    )
    recent_activity = []
    for h in recent:
        entry = h.to_dict()
        entry['complaint_title'] = h.complaint.title if h.complaint else ''
        entry['complaint_id']    = h.complaint_id
        recent_activity.append(entry)

    return jsonify({
        'total_complaints':       total,
        'pending_review':         pending,
        'approved':               approved,
        'in_progress':            in_prog,
        'resolved':               resolved,
        'citizens_participating': citizens,
        'active_initiatives':     initiatives,
        'priority_queue':         priority_queue,
        'recent_activity':        recent_activity,
    }), 200


# ── Complaint List ─────────────────────────────────────────────────────────────

@admin_bp.route('/complaints', methods=['GET'])
@jwt_required()
def list_complaints():
    _, err = _require_admin()
    if err:
        return err

    page     = request.args.get('page',     1,    type=int)
    per_page = request.args.get('per_page', 20,   type=int)
    status   = request.args.get('status')
    category = request.args.get('category')
    priority = request.args.get('priority')
    city     = request.args.get('city')
    date_from = request.args.get('date_from')
    date_to   = request.args.get('date_to')

    q = Complaint.query
    if status:   q = q.filter_by(status=status)
    if category: q = q.filter_by(category=category)
    if priority: q = q.filter_by(priority=priority)
    if city:     q = q.filter(Complaint.city.ilike(f'%{city}%'))
    if date_from:
        try:
            q = q.filter(Complaint.created_at >= datetime.fromisoformat(date_from))
        except ValueError:
            pass
    if date_to:
        try:
            q = q.filter(Complaint.created_at <= datetime.fromisoformat(date_to))
        except ValueError:
            pass

    paginated = q.order_by(Complaint.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )

    results = []
    for c in paginated.items:
        d = c.to_dict()
        d['submitter_name'] = c.user.full_name if c.user else 'Unknown'
        d['verify_count']   = Verification.query.filter_by(complaint_id=c.id, type='verify').count()
        d['support_count']  = Verification.query.filter_by(complaint_id=c.id, type='support').count()
        results.append(d)

    return jsonify({
        'complaints': results,
        'total':      paginated.total,
        'pages':      paginated.pages,
        'page':       page,
        'per_page':   per_page,
    }), 200


# ── Status Update ──────────────────────────────────────────────────────────────

@admin_bp.route('/complaints/<int:complaint_id>/status', methods=['PUT'])
@jwt_required()
def update_status(complaint_id):
    admin, err = _require_admin()
    if err:
        return err

    complaint = Complaint.query.get_or_404(complaint_id)
    data      = request.get_json() or {}
    new_status  = data.get('status')
    note        = data.get('note', '').strip()
    department  = data.get('department', '').strip() or None

    if not new_status:
        return jsonify({'error': 'status is required'}), 400

    old_status = complaint.status
    if new_status == old_status:
        return jsonify({'complaint': complaint.to_dict()}), 200

    complaint.status = new_status
    if department:
        complaint.responsible_department = department

    h = ComplaintStatusHistory(
        complaint_id=complaint_id,
        old_status=old_status,
        new_status=new_status,
        changed_by=admin.id,
        note=note or f'Status changed to {new_status} by admin',
    )
    db.session.add(h)
    db.session.commit()

    # Points and notifications based on new status
    owner_id = complaint.submitted_by

    if new_status == 'approved':
        award_points(owner_id, 'complaint_approved')
        create_notification(
            user_id=owner_id,
            title='Your complaint was approved! ✅',
            message=f'"{complaint.title}" has been reviewed and approved by the administration.',
            type='complaint',
            complaint_id=complaint_id,
        )

    elif new_status == 'resolved':
        award_points(owner_id, 'complaint_resolved')
        complaint.resolved_at = datetime.utcnow()
        db.session.commit()
        create_notification(
            user_id=owner_id,
            title='Your complaint has been resolved! 🎉',
            message=(
                f'Great news! "{complaint.title}" has been resolved. '
                f'You earned 50 bonus points for your civic contribution.'
            ),
            type='complaint',
            complaint_id=complaint_id,
        )

    elif new_status == 'in_progress':
        create_notification(
            user_id=owner_id,
            title='Work started on your complaint 🔧',
            message=f'"{complaint.title}" is now in progress. Expected timeline: {complaint.timeline or "TBD"}.',
            type='complaint',
            complaint_id=complaint_id,
        )

    elif new_status == 'assigned':
        dept = complaint.responsible_department or department or 'the relevant department'
        create_notification(
            user_id=owner_id,
            title='Your complaint has been assigned',
            message=f'"{complaint.title}" has been assigned to {dept}.',
            type='complaint',
            complaint_id=complaint_id,
        )

    elif new_status == 'under_review' and note:
        # Rejection with note
        create_notification(
            user_id=owner_id,
            title='Update on your complaint',
            message=f'Your complaint "{complaint.title}" needs attention: {note}',
            type='warning',
            complaint_id=complaint_id,
        )

    return jsonify({'complaint': complaint.to_dict(), 'message': f'Status updated to {new_status}'}), 200


# ── Initiatives ────────────────────────────────────────────────────────────────

@admin_bp.route('/initiatives', methods=['GET'])
@jwt_required()
def list_initiatives():
    _, err = _require_admin()
    if err:
        return err

    initiatives = Initiative.query.order_by(Initiative.created_at.desc()).all()
    results = []
    for ini in initiatives:
        linked = Complaint.query.filter_by(initiative_id=ini.id).all()
        results.append({
            'id':                     ini.id,
            'title':                  ini.title,
            'description':            ini.description,
            'category':               ini.category,
            'status':                 ini.status,
            'total_complaints':       ini.total_complaints or len(linked),
            'total_citizens_affected': ini.total_citizens_affected or 0,
            'estimated_budget':       ini.estimated_budget,
            'timeline':               ini.timeline,
            'department':             ini.department,
            'created_at':             ini.created_at.isoformat() if ini.created_at else None,
            'complaints': [
                {
                    'id':     c.id,
                    'title':  c.title,
                    'status': c.status,
                    'city':   c.city,
                }
                for c in linked
            ],
        })

    total_clustered  = sum(r['total_complaints'] for r in results)
    total_citizens   = sum(r['total_citizens_affected'] for r in results)

    return jsonify({
        'initiatives':      results,
        'total':            len(results),
        'total_clustered':  total_clustered,
        'total_citizens':   total_citizens,
    }), 200


@admin_bp.route('/initiatives/<int:initiative_id>', methods=['PUT'])
@jwt_required()
def update_initiative(initiative_id):
    _, err = _require_admin()
    if err:
        return err

    ini  = Initiative.query.get_or_404(initiative_id)
    data = request.get_json() or {}

    for field in ('status', 'title', 'description', 'estimated_budget', 'timeline', 'department'):
        if field in data:
            setattr(ini, field, data[field])

    db.session.commit()
    return jsonify({'message': 'Initiative updated', 'id': ini.id}), 200


# ── Leaderboard ───────────────────────────────────────────────────────────────

@admin_bp.route('/leaderboard', methods=['GET'])
def leaderboard():
    users = (
        User.query
        .filter_by(role='citizen', is_active=True)
        .order_by(User.points.desc())
        .limit(50)
        .all()
    )

    now = datetime.utcnow()
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    results = []
    for rank, u in enumerate(users, 1):
        total_complaints = Complaint.query.filter_by(submitted_by=u.id).count()
        resolved_count   = Complaint.query.filter_by(submitted_by=u.id, status='resolved').count()
        results.append({
            'rank':              rank,
            'id':                u.id,
            'full_name':         u.full_name,
            'city':              u.city,
            'points':            u.points,
            'current_badge':     u.current_badge,
            'complaints_count':  total_complaints,
            'resolved_count':    resolved_count,
        })

    # Monthly awards — most submissions, most verifications, highest impact score
    top_reporter = (
        db.session.query(User.id, User.full_name, func.count(Complaint.id).label('cnt'))
        .join(Complaint, Complaint.submitted_by == User.id)
        .filter(Complaint.created_at >= month_start)
        .group_by(User.id, User.full_name)
        .order_by(func.count(Complaint.id).desc())
        .first()
    )
    top_verifier = (
        db.session.query(User.id, User.full_name, func.count(Verification.id).label('cnt'))
        .join(Verification, Verification.user_id == User.id)
        .filter(Verification.type == 'verify', Verification.created_at >= month_start)
        .group_by(User.id, User.full_name)
        .order_by(func.count(Verification.id).desc())
        .first()
    )
    top_impact = (
        db.session.query(User.id, User.full_name, func.sum(Complaint.impact_score).label('total'))
        .join(Complaint, Complaint.submitted_by == User.id)
        .filter(Complaint.created_at >= month_start)
        .group_by(User.id, User.full_name)
        .order_by(func.sum(Complaint.impact_score).desc())
        .first()
    )

    monthly_awards = {
        'best_reporter':    {'name': top_reporter.full_name,  'count': top_reporter.cnt}  if top_reporter  else None,
        'community_champ':  {'name': top_verifier.full_name,  'count': top_verifier.cnt}  if top_verifier  else None,
        'impact_leader':    {'name': top_impact.full_name,    'score': float(top_impact.total or 0)} if top_impact else None,
    }

    return jsonify({'leaderboard': results, 'monthly_awards': monthly_awards}), 200


# ── AI Copilot ────────────────────────────────────────────────────────────────

@admin_bp.route('/copilot', methods=['POST'])
@jwt_required()
def copilot():
    admin, err = _require_admin()
    if err:
        return err

    data         = request.get_json() or {}
    user_message = (data.get('message') or '').strip()
    history      = data.get('conversation_history', [])

    if not user_message:
        return jsonify({'error': 'message is required'}), 400

    # ── Live data context ──────────────────────────────────────────
    total      = Complaint.query.count()
    pending    = Complaint.query.filter_by(status='under_review').count()
    in_prog    = Complaint.query.filter_by(status='in_progress').count()
    resolved   = Complaint.query.filter_by(status='resolved').count()

    month_start = datetime.utcnow() - timedelta(days=30)
    resolved_month = Complaint.query.filter(
        Complaint.status == 'resolved',
        Complaint.resolved_at >= month_start,
    ).count()

    high_prio = Complaint.query.filter(
        Complaint.priority.in_(['high', 'critical']),
        Complaint.status == 'under_review',
    ).count()

    top_cats = (
        db.session.query(Complaint.category, func.count(Complaint.id).label('cnt'))
        .group_by(Complaint.category)
        .order_by(func.count(Complaint.id).desc())
        .limit(5)
        .all()
    )

    top_cities = (
        db.session.query(Complaint.city, func.count(Complaint.id).label('cnt'))
        .filter(Complaint.city.isnot(None))
        .group_by(Complaint.city)
        .order_by(func.count(Complaint.id).desc())
        .limit(3)
        .all()
    )

    initiatives_count = Initiative.query.count()

    cat_summary  = ', '.join(f"{c[0]} ({c[1]})" for c in top_cats)  if top_cats  else 'N/A'
    city_summary = ', '.join(f"{c[0]} ({c[1]})" for c in top_cities) if top_cities else 'N/A'

    system_context = f"""You are the CivicAlign Admin AI Copilot — a professional civic data analyst \
helping city administrators understand complaint trends and make decisions.

Current live platform data (updated just now):
- Total complaints: {total}
- Pending review: {pending}
- In progress: {in_prog}
- Resolved (all time): {resolved}
- Resolved this month: {resolved_month}
- High/critical priority pending: {high_prio}
- Active initiatives: {initiatives_count}
- Top complaint categories: {cat_summary}
- Most affected cities: {city_summary}

Guidelines:
- Use the live data above when answering questions about numbers or trends.
- Format lists as markdown bullet points or numbered lists.
- Format comparisons or multi-column data as markdown tables.
- Be concise (under 300 words) unless a detailed report is explicitly requested.
- Be specific and actionable in recommendations.
- If asked to predict or forecast, caveat with 'based on current trends'.
"""

    # ── Call Gemini ────────────────────────────────────────────────
    try:
        import google.generativeai as genai
        api_key = os.getenv('GEMINI_API_KEY')
        if api_key:
            genai.configure(api_key=api_key)

        model = genai.GenerativeModel(
            'gemini-2.5-flash',
            system_instruction=system_context,
        )

        # Build Gemini-format history from last 10 exchanges
        gemini_history = []
        for msg in history[-10:]:
            role    = msg.get('role', 'user')
            content = msg.get('content', '')
            # Gemini uses 'user' and 'model' roles only
            if role not in ('user', 'model'):
                role = 'user'
            gemini_history.append({'role': role, 'parts': [content]})

        chat     = model.start_chat(history=gemini_history)
        response = chat.send_message(user_message)

        return jsonify({'response': response.text, 'role': 'model'}), 200

    except Exception as e:
        # Graceful fallback when Gemini is unavailable
        fallback = (
            f"I'm currently unable to reach the AI service. "
            f"Here's what I can tell you from the live data:\n\n"
            f"- **Total complaints**: {total}\n"
            f"- **Pending review**: {pending}\n"
            f"- **Resolved this month**: {resolved_month}\n"
            f"- **High/critical pending**: {high_prio}\n"
            f"- **Top categories**: {cat_summary}\n\n"
            f"Please check your `GEMINI_API_KEY` environment variable."
        )
        return jsonify({'response': fallback, 'role': 'model'}), 200
