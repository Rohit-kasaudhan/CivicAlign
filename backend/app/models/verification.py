from app.extensions import db
from datetime import datetime


class Verification(db.Model):
    __tablename__ = 'verifications'
    __table_args__ = (
        db.UniqueConstraint('complaint_id', 'user_id', 'type', name='uq_verification_per_user_type'),
    )

    id = db.Column(db.Integer, primary_key=True)
    complaint_id = db.Column(db.Integer, db.ForeignKey('complaints.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    type = db.Column(db.String(20), nullable=False)  # 'verify' or 'support'
    image_path = db.Column(db.String(256), nullable=True)
    note = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'complaint_id': self.complaint_id,
            'user_id': self.user_id,
            'type': self.type,
            'note': self.note,
            'image_path': self.image_path,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'user': {
                'full_name': self.verifier.full_name,
                'current_badge': self.verifier.current_badge,
            } if self.verifier else None,
        }
