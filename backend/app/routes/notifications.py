from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.extensions import db
from app.models.notification import Notification

notifications_bp = Blueprint('notifications', __name__)


@notifications_bp.route('', methods=['GET'])
@jwt_required()
def get_notifications():
    user_id     = int(get_jwt_identity())
    unread_only = request.args.get('unread_only', 'false').lower() == 'true'

    q = Notification.query.filter_by(user_id=user_id)
    if unread_only:
        q = q.filter_by(is_read=False)

    items = q.order_by(Notification.created_at.desc()).limit(20).all()

    unread_count = Notification.query.filter_by(user_id=user_id, is_read=False).count()

    return jsonify({
        'notifications': [
            {
                'id':           n.id,
                'title':        n.title,
                'message':      n.message,
                'type':         n.type,
                'is_read':      n.is_read,
                'complaint_id': n.complaint_id,
                'created_at':   n.created_at.isoformat() if n.created_at else None,
            }
            for n in items
        ],
        'unread_count': unread_count,
    }), 200


@notifications_bp.route('/<int:notif_id>/read', methods=['PUT'])
@jwt_required()
def mark_read(notif_id):
    user_id = int(get_jwt_identity())
    n = Notification.query.filter_by(id=notif_id, user_id=user_id).first_or_404()
    n.is_read = True
    db.session.commit()
    return jsonify({'success': True}), 200


@notifications_bp.route('/read-all', methods=['PUT'])
@jwt_required()
def mark_all_read():
    user_id = int(get_jwt_identity())
    Notification.query.filter_by(user_id=user_id, is_read=False).update({'is_read': True})
    db.session.commit()
    return jsonify({'success': True}), 200
