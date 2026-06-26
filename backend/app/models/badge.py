from app.extensions import db
from datetime import datetime


class Badge(db.Model):
    """One row per badge earned; most recent earned_at for a user is their current badge."""
    __tablename__ = 'badges'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    badge_name = db.Column(db.String(50), nullable=False)
    earned_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship('User', backref='badge_history')
