import json

from .evidence_agent import EvidenceAgent
from .categorise_agent import CategoriseAgent
from .duplicate_agent import DuplicateAgent
from .impact_agent import ImpactAgent
from .solution_agent import SolutionAgent


def _log_status(complaint, old_status: str, new_status: str, note: str = ''):
    """Insert a ComplaintStatusHistory row and update complaint.status (caller commits)."""
    from app.models.complaint import ComplaintStatusHistory
    from app.extensions import db

    complaint.status = new_status
    h = ComplaintStatusHistory(
        complaint_id=complaint.id,
        old_status=old_status,
        new_status=new_status,
        changed_by=complaint.submitted_by,
        note=note,
    )
    db.session.add(h)


def run_pipeline(complaint_id: int, app):
    """
    Orchestrate the 5-agent AI pipeline for a complaint.
    Called in a background daemon thread after complaint submission.
    Each agent commits its results independently so partial progress is saved.
    """
    with app.app_context():
        from app.models.complaint import Complaint
        from app.extensions import db
        from app.services.notification_service import create_notification

        complaint = Complaint.query.get(complaint_id)
        if not complaint:
            return

        image_paths = json.loads(complaint.image_paths or '[]')

        try:
            # ── Agent 1: Evidence Verification ──────────────────────────────
            ev = EvidenceAgent().run(complaint, image_paths)
            complaint.evidence_score = float(ev.get('evidence_score', 50))
            complaint.trust_score = complaint.evidence_score
            _log_status(complaint, 'submitted', 'ai_processed', 'AI evidence analysis complete')
            db.session.commit()

            # ── Agent 2: Categorisation & Priority ──────────────────────────
            cat = CategoriseAgent().run(complaint, ev)
            complaint.category             = cat['category']
            complaint.subcategory          = cat['subcategory']
            complaint.priority             = cat['priority']
            complaint.ai_subject           = cat['formal_subject']
            complaint.ai_summary           = cat['summary']
            complaint.ai_formal_description = cat['formal_description']
            _log_status(complaint, 'ai_processed', 'evidence_verified', 'Categorisation and priority assigned by AI')
            db.session.commit()

            # ── Agent 3: Duplicate Detection ────────────────────────────────
            dup = DuplicateAgent().run(complaint)
            if dup.get('is_duplicate') and dup.get('duplicate_of_id'):
                complaint.duplicate_of_id = dup['duplicate_of_id']
                _log_status(
                    complaint, 'evidence_verified', 'under_review',
                    f"Marked as possible duplicate of complaint #{dup['duplicate_of_id']} "
                    f"(similarity {dup.get('similarity_score', '?')}%): {dup.get('reason', '')}"
                )
                db.session.commit()
                # Notify user
                create_notification(
                    user_id=complaint.submitted_by,
                    title='Possible Duplicate Detected',
                    message=(
                        f'Your complaint "{complaint.title}" may be a duplicate of an existing report. '
                        'It has been queued for manual review.'
                    ),
                    type='warning',
                    complaint_id=complaint_id,
                )
                return  # Stop pipeline — admin will review

            # ── Agent 4: Impact Assessment ──────────────────────────────────
            imp = ImpactAgent().run(complaint)
            complaint.citizens_affected = imp.get('citizens_affected', 0)
            complaint.severity          = imp.get('severity', 'moderate')
            complaint.economic_impact   = imp.get('economic_impact', 'medium')
            complaint.impact_score      = float(imp.get('impact_score', 50))
            _log_status(complaint, 'evidence_verified', 'community_verified', 'Impact assessment complete')
            db.session.commit()

            # ── Agent 5: Solution Planning ──────────────────────────────────
            sol = SolutionAgent().run(complaint, imp)
            complaint.immediate_actions      = json.dumps(sol.get('immediate_actions', []))
            complaint.short_term_actions     = json.dumps(sol.get('short_term_actions', []))
            complaint.long_term_actions      = json.dumps(sol.get('long_term_actions', []))
            complaint.budget_estimate        = sol.get('budget_estimate', 'TBD')
            complaint.timeline               = sol.get('timeline', 'TBD')
            complaint.responsible_department = sol.get('responsible_department', '')
            db.session.commit()

            # ── Auto-cluster into initiative ────────────────────────────────
            try:
                from app.services.cluster_service import try_cluster_complaint
                try_cluster_complaint(complaint)
            except Exception as cluster_err:
                print(f'[Pipeline] Cluster service error for complaint {complaint_id}: {cluster_err}')

            # ── Notify user of completion ───────────────────────────────────
            create_notification(
                user_id=complaint.submitted_by,
                title='AI Analysis Complete',
                message=(
                    f'Your complaint "{complaint.title}" has been fully processed. '
                    f'Priority: {complaint.priority}. '
                    f'Estimated resolution: {complaint.timeline or "TBD"}.'
                ),
                type='complaint',
                complaint_id=complaint_id,
            )

        except Exception as e:
            try:
                print(f'[Pipeline] Fatal error for complaint {complaint_id}: {str(e).encode("ascii", "replace").decode()}')
            except Exception:
                pass
            try:
                # Fallback: mark as under_review so admins can handle it manually
                complaint.status = 'under_review'
                db.session.commit()
            except Exception:
                db.session.rollback()
