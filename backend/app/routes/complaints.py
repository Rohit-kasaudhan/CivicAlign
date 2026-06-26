import json
import threading
from flask import Blueprint, jsonify, request, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity, verify_jwt_in_request

from app.extensions import db
from app.models.complaint import Complaint, ComplaintStatusHistory
from app.models.verification import Verification
from app.utils.file_handler import save_uploaded_file
from app.services.gamification_service import award_points
from app.services.notification_service import create_notification
from app.agents.pipeline import run_pipeline

complaints_bp = Blueprint('complaints', __name__)


# ── routes ────────────────────────────────────────────────────────────────────

@complaints_bp.route('', methods=['GET'])
def list_complaints():
    page = request.args.get('page', 1, type=int)
    per_page = 20
    q = Complaint.query.order_by(Complaint.created_at.desc())
    paginated = q.paginate(page=page, per_page=per_page, error_out=False)
    return jsonify({
        'complaints': [c.to_dict() for c in paginated.items],
        'total': paginated.total,
        'pages': paginated.pages,
        'page': page,
    }), 200


@complaints_bp.route('/my', methods=['GET'])
@jwt_required()
def my_complaints():
    user_id = int(get_jwt_identity())
    complaints = (
        Complaint.query
        .filter_by(submitted_by=user_id)
        .order_by(Complaint.created_at.desc())
        .all()
    )
    return jsonify({'complaints': [c.to_dict() for c in complaints]}), 200


@complaints_bp.route('/feed', methods=['GET'])
def feed():
    page     = request.args.get('page', 1, type=int)
    category = request.args.get('category')
    status   = request.args.get('status')
    city     = request.args.get('city')

    q = Complaint.query
    if category:
        q = q.filter_by(category=category)
    if status:
        q = q.filter_by(status=status)
    if city:
        q = q.filter(Complaint.city.ilike(f'%{city}%'))

    paginated = q.order_by(Complaint.created_at.desc()).paginate(page=page, per_page=20, error_out=False)

    # Optional auth for user_verified / user_supported
    current_user_id = None
    try:
        verify_jwt_in_request(optional=True)
        identity = get_jwt_identity()
        if identity:
            current_user_id = int(identity)
    except Exception:
        pass

    results = []
    for c in paginated.items:
        d = c.to_dict()
        d['verify_count']  = Verification.query.filter_by(complaint_id=c.id, type='verify').count()
        d['support_count'] = Verification.query.filter_by(complaint_id=c.id, type='support').count()
        d['submitter'] = {
            'id': c.submitted_by,
            'full_name': c.user.full_name if c.user else 'Anonymous',
        }
        if current_user_id:
            d['user_verified']  = bool(Verification.query.filter_by(complaint_id=c.id, user_id=current_user_id, type='verify').first())
            d['user_supported'] = bool(Verification.query.filter_by(complaint_id=c.id, user_id=current_user_id, type='support').first())
        else:
            d['user_verified']  = False
            d['user_supported'] = False
        results.append(d)

    return jsonify({
        'complaints': results,
        'total': paginated.total,
        'pages': paginated.pages,
        'page': page,
    }), 200


@complaints_bp.route('/map', methods=['GET'])
def map_data():
    complaints = (
        Complaint.query
        .filter(Complaint.latitude.isnot(None), Complaint.longitude.isnot(None))
        .with_entities(
            Complaint.id, Complaint.title, Complaint.category,
            Complaint.priority, Complaint.status,
            Complaint.latitude, Complaint.longitude,
        )
        .all()
    )
    return jsonify({
        'complaints': [
            {
                'id': c.id,
                'title': c.title,
                'category': c.category,
                'priority': c.priority,
                'status': c.status,
                'lat': c.latitude,
                'lng': c.longitude,
            }
            for c in complaints
        ]
    }), 200


@complaints_bp.route('', methods=['POST'])
@jwt_required()
def create_complaint():
    user_id = int(get_jwt_identity())

    title       = request.form.get('title', '').strip()
    description = request.form.get('description', '').strip()
    category    = request.form.get('category', '').strip()
    country     = request.form.get('country', '').strip() or None
    state       = request.form.get('state', '').strip() or None
    city        = request.form.get('city', '').strip() or None
    # accept 'address' from frontend, store as landmark
    landmark    = (request.form.get('address') or request.form.get('landmark') or '').strip() or None
    lat_raw     = request.form.get('latitude')
    lng_raw     = request.form.get('longitude')

    if not title or not description or not category:
        return jsonify({'error': 'title, description, and category are required'}), 400

    # Save images (accept both 'images' and 'images[]' keys)
    image_paths = []
    img_files = request.files.getlist('images') or request.files.getlist('images[]')
    for img in img_files:
        if img and img.filename:
            try:
                path = save_uploaded_file(img, 'images')
                if path:
                    image_paths.append(path)
            except ValueError as e:
                return jsonify({'error': str(e)}), 400

    # Save videos (accept both 'videos' and 'video' keys)
    video_paths_list = []
    vid_files = request.files.getlist('videos') or request.files.getlist('video')
    for vid in vid_files:
        if vid and vid.filename:
            try:
                path = save_uploaded_file(vid, 'videos')
                if path:
                    video_paths_list.append(path)
            except ValueError as e:
                return jsonify({'error': str(e)}), 400

    complaint = Complaint(
        title=title,
        description=description,
        category=category,
        country=country,
        state=state,
        city=city,
        landmark=landmark,
        latitude=float(lat_raw)  if lat_raw  else None,
        longitude=float(lng_raw) if lng_raw  else None,
        image_paths=json.dumps(image_paths) if image_paths else None,
        video_paths=json.dumps(video_paths_list) if video_paths_list else None,
        submitted_by=user_id,
        status='submitted',
    )
    db.session.add(complaint)
    db.session.flush()

    history = ComplaintStatusHistory(
        complaint_id=complaint.id,
        old_status=None,
        new_status='submitted',
        changed_by=user_id,
        note='Complaint submitted by citizen',
    )
    db.session.add(history)
    db.session.commit()

    # Award submission points
    award_points(user_id, 10, 'Submitted complaint')

    # Notify user
    create_notification(
        user_id=user_id,
        title='Complaint Submitted',
        message=f'Your complaint "{title}" has been received and is being processed by AI.',
        type='complaint',
        complaint_id=complaint.id,
    )

    # Launch 5-agent AI pipeline in background thread
    app = current_app._get_current_object()
    t = threading.Thread(target=run_pipeline, args=(complaint.id, app))
    t.daemon = True
    t.start()

    return jsonify({'complaint': complaint.to_dict(), 'message': 'Complaint submitted. AI analysis in progress.'}), 201


@complaints_bp.route('/<int:complaint_id>', methods=['GET'])
def complaint_detail(complaint_id):
    complaint = Complaint.query.get_or_404(complaint_id)

    verify_count  = Verification.query.filter_by(complaint_id=complaint_id, type='verify').count()
    support_count = Verification.query.filter_by(complaint_id=complaint_id, type='support').count()
    recent_verifs = (
        Verification.query
        .filter_by(complaint_id=complaint_id)
        .order_by(Verification.created_at.desc())
        .limit(10)
        .all()
    )

    # Current user's verifications (if authenticated)
    current_user_id = None
    try:
        verify_jwt_in_request(optional=True)
        identity = get_jwt_identity()
        if identity:
            current_user_id = int(identity)
    except Exception:
        pass

    user_verified = user_supported = False
    if current_user_id:
        user_verified = bool(Verification.query.filter_by(
            complaint_id=complaint_id, user_id=current_user_id, type='verify'
        ).first())
        user_supported = bool(Verification.query.filter_by(
            complaint_id=complaint_id, user_id=current_user_id, type='support'
        ).first())

    data = complaint.to_dict()
    data['submitter'] = {
        'id': complaint.submitted_by,
        'full_name': complaint.user.full_name if complaint.user else 'Unknown',
        'current_badge': complaint.user.current_badge if complaint.user else '',
    }
    data['verify_count']   = verify_count
    data['support_count']  = support_count
    data['verifications']  = [v.to_dict() for v in recent_verifs]
    data['status_history'] = [h.to_dict() for h in complaint.status_history]
    data['user_verified']  = user_verified
    data['user_supported'] = user_supported

    if complaint.initiative:
        data['initiative'] = {
            'id': complaint.initiative.id,
            'title': complaint.initiative.title,
            'description': complaint.initiative.description,
            'total_complaints': complaint.initiative.total_complaints,
            'status': complaint.initiative.status,
        }

    return jsonify({'complaint': data}), 200


@complaints_bp.route('/<int:complaint_id>', methods=['PUT'])
@jwt_required()
def update_complaint(complaint_id):
    complaint = Complaint.query.get_or_404(complaint_id)
    data = request.get_json() or {}
    user_id = int(get_jwt_identity())

    if 'status' in data and data['status'] != complaint.status:
        old_status = complaint.status
        complaint.status = data['status']
        h = ComplaintStatusHistory(
            complaint_id=complaint_id,
            old_status=old_status,
            new_status=data['status'],
            changed_by=user_id,
            note=data.get('note', ''),
        )
        db.session.add(h)

    db.session.commit()
    return jsonify({'complaint': complaint.to_dict()}), 200
