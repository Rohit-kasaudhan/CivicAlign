from app.extensions import db
from datetime import datetime
import uuid


class Complaint(db.Model):
    __tablename__ = 'complaints'

    id = db.Column(db.Integer, primary_key=True)
    uuid = db.Column(db.String(36), unique=True, default=lambda: str(uuid.uuid4()))
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    category = db.Column(db.String(50), nullable=False)
    subcategory = db.Column(db.String(50), nullable=True)
    priority = db.Column(db.String(20), default='medium')  # low/medium/high/critical
    status = db.Column(db.String(30), default='submitted')
    # submitted → ai_processed → evidence_verified → community_verified
    # → under_review → approved → assigned → in_progress → resolved → closed

    # Location
    country = db.Column(db.String(100), nullable=True)
    state = db.Column(db.String(100), nullable=True)
    city = db.Column(db.String(100), nullable=True)
    landmark = db.Column(db.String(200), nullable=True)
    latitude = db.Column(db.Float, nullable=True)
    longitude = db.Column(db.Float, nullable=True)

    # Media (JSON arrays stored as text)
    image_paths = db.Column(db.Text, nullable=True)
    video_paths = db.Column(db.Text, nullable=True)

    # AI-generated fields
    ai_summary = db.Column(db.Text, nullable=True)
    ai_subject = db.Column(db.Text, nullable=True)
    ai_formal_description = db.Column(db.Text, nullable=True)

    # Scores
    evidence_score = db.Column(db.Float, default=0.0)
    trust_score = db.Column(db.Float, default=0.0)
    impact_score = db.Column(db.Float, default=0.0)

    # Impact analysis
    citizens_affected = db.Column(db.Integer, default=0)
    economic_impact = db.Column(db.String(50), nullable=True)
    severity = db.Column(db.String(20), nullable=True)

    # Action plans (JSON stored as text)
    immediate_actions = db.Column(db.Text, nullable=True)
    short_term_actions = db.Column(db.Text, nullable=True)
    long_term_actions = db.Column(db.Text, nullable=True)

    # Resolution metadata
    budget_estimate = db.Column(db.String(100), nullable=True)
    timeline = db.Column(db.String(100), nullable=True)
    responsible_department = db.Column(db.String(100), nullable=True)

    # References
    duplicate_of_id = db.Column(db.Integer, db.ForeignKey('complaints.id'), nullable=True)
    initiative_id = db.Column(db.Integer, db.ForeignKey('initiatives.id'), nullable=True)

    # Users
    submitted_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    assigned_admin = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)

    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, onupdate=datetime.utcnow)
    resolved_at = db.Column(db.DateTime, nullable=True)

    def to_dict(self):
        return {
            'id': self.id,
            'uuid': self.uuid,
            'title': self.title,
            'description': self.description,
            'category': self.category,
            'subcategory': self.subcategory,
            'priority': self.priority,
            'status': self.status,
            'country': self.country,
            'state': self.state,
            'city': self.city,
            'landmark': self.landmark,
            'latitude': self.latitude,
            'longitude': self.longitude,
            'image_paths': self.image_paths,
            'video_paths': self.video_paths,
            'ai_summary': self.ai_summary,
            'ai_subject': self.ai_subject,
            'ai_formal_description': self.ai_formal_description,
            'evidence_score': self.evidence_score,
            'trust_score': self.trust_score,
            'impact_score': self.impact_score,
            'immediate_actions': self.immediate_actions,
            'short_term_actions': self.short_term_actions,
            'long_term_actions': self.long_term_actions,
            'citizens_affected': self.citizens_affected,
            'economic_impact': self.economic_impact,
            'severity': self.severity,
            'budget_estimate': self.budget_estimate,
            'timeline': self.timeline,
            'responsible_department': self.responsible_department,
            'submitted_by': self.submitted_by,
            'assigned_admin': self.assigned_admin,
            'initiative_id': self.initiative_id,
            'duplicate_of_id': self.duplicate_of_id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'resolved_at': self.resolved_at.isoformat() if self.resolved_at else None,
            'address': self.landmark,  # alias for frontend
        }

    # Relationships
    user = db.relationship('User', foreign_keys=[submitted_by], backref='complaints')
    admin = db.relationship('User', foreign_keys=[assigned_admin], backref='assigned_complaints')
    initiative = db.relationship('Initiative', backref='complaints')
    verifications = db.relationship('Verification', backref='complaint', lazy=True)
    status_history = db.relationship('ComplaintStatusHistory', backref='complaint', lazy=True)


class ComplaintStatusHistory(db.Model):
    __tablename__ = 'complaint_status_history'

    id = db.Column(db.Integer, primary_key=True)
    complaint_id = db.Column(db.Integer, db.ForeignKey('complaints.id'), nullable=False)
    old_status = db.Column(db.String(30), nullable=True)
    new_status = db.Column(db.String(30), nullable=False)
    changed_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    note = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    changer = db.relationship('User', foreign_keys=[changed_by])

    def to_dict(self):
        return {
            'id': self.id,
            'old_status': self.old_status,
            'new_status': self.new_status,
            'changed_by': self.changed_by,
            'changer_name': self.changer.full_name if self.changer else 'System',
            'note': self.note,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
