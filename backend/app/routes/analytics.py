from datetime import datetime, timedelta

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import func, case, text

from app.extensions import db
from app.models.complaint import Complaint
from app.models.user import User

analytics_bp = Blueprint('analytics', __name__)


def _require_admin():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user or user.role != 'admin':
        return None, (jsonify({'error': 'Admin access required'}), 403)
    return user, None


def _date_filters():
    """Return SQLAlchemy filter expressions from start_date / end_date query params."""
    filters = []
    start = request.args.get('start_date')
    end   = request.args.get('end_date')
    try:
        if start:
            filters.append(Complaint.created_at >= datetime.fromisoformat(start))
    except ValueError:
        pass
    try:
        if end:
            filters.append(Complaint.created_at <= datetime.fromisoformat(end))
    except ValueError:
        pass
    return filters


# Fresh instance per call — avoids SQLAlchemy "already used in query" errors.
_RESOLVED_CASE = lambda: case(
    (Complaint.status.in_(['resolved', 'closed']), 1),
    else_=0,
)

# PostgreSQL: difference in days between two timestamp columns.
def _days_diff(end_col, start_col):
    return func.extract('epoch', end_col - start_col) / 86400.0


# ── Overview ──────────────────────────────────────────────────────────────────

@analytics_bp.route('/overview', methods=['GET'])
@jwt_required()
def overview():
    _, err = _require_admin()
    if err:
        return err

    df = _date_filters()

    q = Complaint.query
    for f in df:
        q = q.filter(f)

    total    = q.count()
    resolved = q.filter(Complaint.status.in_(['resolved', 'closed'])).count()
    rate     = round(resolved / total * 100, 1) if total else 0.0

    now         = datetime.utcnow()
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    resolved_this_month = Complaint.query.filter(
        Complaint.status.in_(['resolved', 'closed']),
        Complaint.resolved_at >= month_start,
    ).count()

    avg_q = db.session.query(
        func.avg(_days_diff(Complaint.resolved_at, Complaint.created_at))
    ).filter(Complaint.resolved_at.isnot(None))
    for f in df:
        avg_q = avg_q.filter(f)
    avg_days = round(float(avg_q.scalar() or 0), 1)

    top_cat = (
        db.session.query(Complaint.category, func.count(Complaint.id).label('cnt'))
        .filter(*df)
        .group_by(Complaint.category)
        .order_by(func.count(Complaint.id).desc())
        .first()
    )
    top_city = (
        db.session.query(Complaint.city, func.count(Complaint.id).label('cnt'))
        .filter(Complaint.city.isnot(None), *df)
        .group_by(Complaint.city)
        .order_by(func.count(Complaint.id).desc())
        .first()
    )

    return jsonify({
        'total_complaints':    total,
        'resolved_this_month': resolved_this_month,
        'avg_resolution_days': avg_days,
        'resolution_rate':     rate,
        'top_category':        top_cat.category if top_cat else 'N/A',
        'most_affected_city':  top_city.city if top_city else 'N/A',
    }), 200


# ── By Category ───────────────────────────────────────────────────────────────

@analytics_bp.route('/by-category', methods=['GET'])
@jwt_required()
def by_category():
    _, err = _require_admin()
    if err:
        return err

    df = _date_filters()
    rows = (
        db.session.query(
            Complaint.category,
            func.count(Complaint.id).label('count'),
            func.sum(_RESOLVED_CASE()).label('resolved_count'),
        )
        .filter(*df)
        .group_by(Complaint.category)
        .order_by(func.count(Complaint.id).desc())
        .all()
    )

    return jsonify([
        {
            'category':       r.category or 'Unknown',
            'count':          r.count,
            'resolved_count': int(r.resolved_count or 0),
        }
        for r in rows
    ]), 200


# ── Monthly Trend ─────────────────────────────────────────────────────────────

@analytics_bp.route('/monthly-trend', methods=['GET'])
@jwt_required()
def monthly_trend():
    _, err = _require_admin()
    if err:
        return err

    df = _date_filters()
    if not df:
        cutoff = datetime.utcnow() - timedelta(days=365)
        df = [Complaint.created_at >= cutoff]

    # PostgreSQL: to_char(timestamp, 'YYYY-MM') for year-month grouping
    month_col = func.to_char(Complaint.created_at, 'YYYY-MM').label('month')
    rows = (
        db.session.query(
            month_col,
            func.count(Complaint.id).label('submitted'),
            func.sum(_RESOLVED_CASE()).label('resolved'),
        )
        .filter(*df)
        .group_by(month_col)
        .order_by(month_col)
        .all()
    )

    return jsonify([
        {
            'month':     r.month,
            'submitted': r.submitted,
            'resolved':  int(r.resolved or 0),
        }
        for r in rows
    ]), 200


# ── By Status ─────────────────────────────────────────────────────────────────

@analytics_bp.route('/by-status', methods=['GET'])
@jwt_required()
def by_status():
    _, err = _require_admin()
    if err:
        return err

    df = _date_filters()
    rows = (
        db.session.query(Complaint.status, func.count(Complaint.id).label('count'))
        .filter(*df)
        .group_by(Complaint.status)
        .order_by(func.count(Complaint.id).desc())
        .all()
    )
    return jsonify([{'status': r.status, 'count': r.count} for r in rows]), 200


# ── By Priority ───────────────────────────────────────────────────────────────

@analytics_bp.route('/by-priority', methods=['GET'])
@jwt_required()
def by_priority():
    _, err = _require_admin()
    if err:
        return err

    df = _date_filters()
    rows = (
        db.session.query(Complaint.priority, func.count(Complaint.id).label('count'))
        .filter(*df)
        .group_by(Complaint.priority)
        .order_by(func.count(Complaint.id).desc())
        .all()
    )
    return jsonify([{'priority': r.priority or 'unknown', 'count': r.count} for r in rows]), 200


# ── By City (top 10) ──────────────────────────────────────────────────────────

@analytics_bp.route('/by-city', methods=['GET'])
@jwt_required()
def by_city():
    _, err = _require_admin()
    if err:
        return err

    df = _date_filters()
    rows = (
        db.session.query(Complaint.city, func.count(Complaint.id).label('count'))
        .filter(Complaint.city.isnot(None), Complaint.city != '', *df)
        .group_by(Complaint.city)
        .order_by(func.count(Complaint.id).desc())
        .limit(10)
        .all()
    )
    return jsonify([{'city': r.city, 'count': r.count} for r in rows]), 200


# ── Department Performance ────────────────────────────────────────────────────

@analytics_bp.route('/department-performance', methods=['GET'])
@jwt_required()
def department_performance():
    _, err = _require_admin()
    if err:
        return err

    df = _date_filters()
    rows = (
        db.session.query(
            Complaint.responsible_department.label('department'),
            func.count(Complaint.id).label('total_assigned'),
            func.sum(_RESOLVED_CASE()).label('total_resolved'),
            func.avg(
                _days_diff(Complaint.resolved_at, Complaint.created_at)
            ).label('avg_days'),
        )
        .filter(
            Complaint.responsible_department.isnot(None),
            Complaint.responsible_department != '',
            *df,
        )
        .group_by(Complaint.responsible_department)
        .all()
    )

    result = []
    for r in rows:
        assigned   = r.total_assigned or 0
        resolved   = int(r.total_resolved or 0)
        avg_d      = round(float(r.avg_days or 0), 1)
        efficiency = round(resolved / assigned * 100, 1) if assigned else 0.0
        result.append({
            'department':          r.department,
            'total_assigned':      assigned,
            'total_resolved':      resolved,
            'avg_resolution_days': avg_d,
            'efficiency_score':    efficiency,
        })

    result.sort(key=lambda x: x['efficiency_score'], reverse=True)
    return jsonify(result), 200
