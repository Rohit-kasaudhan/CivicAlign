import threading

from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.extensions import db
from app.models.complaint import Complaint
from app.models.user import User

ai_bp = Blueprint('ai', __name__)


@ai_bp.route('/complaints/<int:complaint_id>/ai-status', methods=['GET'])
def ai_status(complaint_id):
    """
    GET /api/ai/complaints/:id/ai-status
    Return current AI processing status and all AI-generated fields for a complaint.
    """
    complaint = Complaint.query.get_or_404(complaint_id)

    pipeline_done = complaint.status not in ('submitted', 'ai_processed', 'evidence_verified')

    return jsonify({
        'complaint_id': complaint_id,
        'status': complaint.status,
        'pipeline_complete': pipeline_done,
        'ai_fields': {
            'ai_summary':            complaint.ai_summary,
            'ai_subject':            complaint.ai_subject,
            'ai_formal_description': complaint.ai_formal_description,
            'subcategory':           complaint.subcategory,
            'priority':              complaint.priority,
            'evidence_score':        complaint.evidence_score,
            'trust_score':           complaint.trust_score,
            'impact_score':          complaint.impact_score,
            'citizens_affected':     complaint.citizens_affected,
            'economic_impact':       complaint.economic_impact,
            'severity':              complaint.severity,
            'immediate_actions':     complaint.immediate_actions,
            'short_term_actions':    complaint.short_term_actions,
            'long_term_actions':     complaint.long_term_actions,
            'budget_estimate':       complaint.budget_estimate,
            'timeline':              complaint.timeline,
            'responsible_department': complaint.responsible_department,
            'duplicate_of_id':       complaint.duplicate_of_id,
            'initiative_id':         complaint.initiative_id,
        },
    }), 200


@ai_bp.route('/admin/complaints/<int:complaint_id>/reprocess', methods=['POST'])
@jwt_required()
def reprocess_complaint(complaint_id):
    """
    POST /api/ai/admin/complaints/:id/reprocess
    Admin-only: re-run the full AI pipeline for a complaint.
    """
    from flask import current_app

    user_id = int(get_jwt_identity())
    user = User.query.get_or_404(user_id)
    if user.role != 'admin':
        return jsonify({'error': 'Admin access required'}), 403

    complaint = Complaint.query.get_or_404(complaint_id)

    # Reset AI fields so pipeline runs fresh
    complaint.ai_summary             = None
    complaint.ai_subject             = None
    complaint.ai_formal_description  = None
    complaint.subcategory            = None
    complaint.priority               = 'medium'
    complaint.evidence_score         = 0.0
    complaint.impact_score           = 0.0
    complaint.citizens_affected      = 0
    complaint.economic_impact        = None
    complaint.severity               = None
    complaint.immediate_actions      = None
    complaint.short_term_actions     = None
    complaint.long_term_actions      = None
    complaint.budget_estimate        = None
    complaint.timeline               = None
    complaint.responsible_department = None
    complaint.duplicate_of_id        = None
    complaint.status                 = 'submitted'
    db.session.commit()

    # Fire pipeline in background thread
    from app.agents.pipeline import run_pipeline
    app = current_app._get_current_object()
    t = threading.Thread(target=run_pipeline, args=(complaint_id, app))
    t.daemon = True
    t.start()

    return jsonify({
        'message': f'AI pipeline restarted for complaint #{complaint_id}.',
        'complaint_id': complaint_id,
    }), 202
