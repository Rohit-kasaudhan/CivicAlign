from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.extensions import db
from app.models.complaint import Complaint
from app.models.verification import Verification
from app.services.gamification_service import award_points
from app.services.notification_service import create_notification
from app.utils.file_handler import save_uploaded_file

community_bp = Blueprint('community', __name__)


@community_bp.route('/feed', methods=['GET'])
def community_feed():
    complaints = Complaint.query.order_by(Complaint.created_at.desc()).limit(20).all()
    return jsonify({'complaints': [c.to_dict() for c in complaints]}), 200


@community_bp.route('/verify', methods=['POST'])
@jwt_required()
def verify_complaint():
    user_id = int(get_jwt_identity())

    complaint_id = request.form.get('complaint_id') or (request.get_json() or {}).get('complaint_id')
    note         = (request.form.get('note') or (request.get_json() or {}).get('note', '') or '').strip() or None

    if not complaint_id:
        return jsonify({'error': 'complaint_id is required'}), 400

    complaint = Complaint.query.get_or_404(int(complaint_id))

    if complaint.submitted_by == user_id:
        return jsonify({'error': 'You cannot verify your own complaint'}), 400

    existing = Verification.query.filter_by(
        complaint_id=complaint.id, user_id=user_id, type='verify'
    ).first()
    if existing:
        return jsonify({'error': 'You have already verified this complaint'}), 400

    # Optional image
    image_path = None
    image_file = request.files.get('image')
    if image_file and image_file.filename:
        try:
            image_path = save_uploaded_file(image_file, 'images')
        except ValueError as e:
            return jsonify({'error': str(e)}), 400

    v = Verification(
        complaint_id=complaint.id,
        user_id=user_id,
        type='verify',
        note=note,
        image_path=image_path,
    )
    db.session.add(v)

    # Recalculate trust score
    verify_count = Verification.query.filter_by(complaint_id=complaint.id, type='verify').count() + 1
    complaint.trust_score = min(100.0, (verify_count / (verify_count + 1)) * 100)
    if verify_count >= 3 and complaint.status == 'ai_processed':
        complaint.status = 'community_verified'

    db.session.commit()
    award_points(user_id, 10, 'Verified complaint')

    create_notification(
        user_id=complaint.submitted_by,
        title='Your complaint was verified!',
        message=f'A citizen verified your complaint "{complaint.title}".',
        type='verification',
        complaint_id=complaint.id,
    )

    return jsonify({
        'message': 'Verification recorded',
        'trust_score': complaint.trust_score,
        'verify_count': verify_count,
    }), 201


@community_bp.route('/support', methods=['POST'])
@jwt_required()
def support_complaint():
    user_id = int(get_jwt_identity())

    complaint_id = request.form.get('complaint_id') or (request.get_json() or {}).get('complaint_id')
    note         = (request.form.get('note') or (request.get_json() or {}).get('note', '') or '').strip() or None

    if not complaint_id:
        return jsonify({'error': 'complaint_id is required'}), 400

    complaint = Complaint.query.get_or_404(int(complaint_id))

    existing = Verification.query.filter_by(
        complaint_id=complaint.id, user_id=user_id, type='support'
    ).first()
    if existing:
        return jsonify({'error': 'You have already supported this complaint'}), 400

    # Optional image — earns more points
    image_path = None
    image_file = request.files.get('image')
    if image_file and image_file.filename:
        try:
            image_path = save_uploaded_file(image_file, 'images')
        except ValueError as e:
            return jsonify({'error': str(e)}), 400

    v = Verification(
        complaint_id=complaint.id,
        user_id=user_id,
        type='support',
        note=note,
        image_path=image_path,
    )
    db.session.add(v)
    db.session.commit()

    points = 15 if image_path else 10
    award_points(user_id, points, 'Supported complaint')

    create_notification(
        user_id=complaint.submitted_by,
        title='Someone supported your complaint!',
        message=f'A citizen added their support to "{complaint.title}".',
        type='verification',
        complaint_id=complaint.id,
    )

    support_count = Verification.query.filter_by(complaint_id=complaint.id, type='support').count()

    return jsonify({
        'message': 'Support recorded',
        'support_count': support_count,
    }), 201


@community_bp.route('/complaint/<int:complaint_id>/verifications', methods=['GET'])
def get_verifications(complaint_id):
    verifications = (
        Verification.query
        .filter_by(complaint_id=complaint_id)
        .order_by(Verification.created_at.desc())
        .all()
    )
    return jsonify({'verifications': [v.to_dict() for v in verifications]}), 200
