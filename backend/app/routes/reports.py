from datetime import datetime

from flask import Blueprint, send_file, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.extensions import db
from app.models.complaint import Complaint, ComplaintStatusHistory
from app.models.initiative import Initiative
from app.models.user import User
from app.models.verification import Verification
from app.services.pdf_service import generate_complaint_pdf, generate_initiative_pdf

reports_bp = Blueprint('reports', __name__)


@reports_bp.route('/complaint/<int:complaint_id>', methods=['GET'])
@jwt_required()
def complaint_report(complaint_id):
    requester_id = int(get_jwt_identity())
    requester    = User.query.get(requester_id)
    if not requester:
        return jsonify({'error': 'User not found'}), 404

    complaint = Complaint.query.get_or_404(complaint_id)

    # Citizens can only download their own complaint reports
    if requester.role != 'admin' and complaint.submitted_by != requester_id:
        return jsonify({'error': 'Access denied — you can only download your own complaint reports'}), 403

    owner          = User.query.get(complaint.submitted_by)
    verifications  = Verification.query.filter_by(complaint_id=complaint_id).all()
    status_history = (
        ComplaintStatusHistory.query
        .filter_by(complaint_id=complaint_id)
        .order_by(ComplaintStatusHistory.created_at.asc())
        .all()
    )

    try:
        pdf_buffer = generate_complaint_pdf(complaint, owner, verifications, status_history)
    except Exception as e:
        return jsonify({'error': f'PDF generation failed: {str(e)}'}), 500

    date_str = datetime.utcnow().strftime('%Y%m%d')
    filename = f"civicalign_complaint_{complaint_id}_{date_str}.pdf"

    return send_file(
        pdf_buffer,
        mimetype='application/pdf',
        as_attachment=True,
        download_name=filename,
    )


@reports_bp.route('/initiative/<int:initiative_id>', methods=['GET'])
@jwt_required()
def initiative_report(initiative_id):
    requester_id = int(get_jwt_identity())
    requester    = User.query.get(requester_id)
    if not requester or requester.role != 'admin':
        return jsonify({'error': 'Admin access required'}), 403

    initiative        = Initiative.query.get_or_404(initiative_id)
    linked_complaints = (
        Complaint.query
        .filter_by(initiative_id=initiative_id)
        .order_by(Complaint.created_at.desc())
        .all()
    )

    try:
        pdf_buffer = generate_initiative_pdf(initiative, linked_complaints)
    except Exception as e:
        return jsonify({'error': f'PDF generation failed: {str(e)}'}), 500

    date_str = datetime.utcnow().strftime('%Y%m%d')
    filename = f"civicalign_initiative_{initiative_id}_{date_str}.pdf"

    return send_file(
        pdf_buffer,
        mimetype='application/pdf',
        as_attachment=True,
        download_name=filename,
    )
