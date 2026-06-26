from app.extensions import db
from datetime import datetime


class Initiative(db.Model):
    __tablename__ = 'initiatives'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    category = db.Column(db.String(50), nullable=False)
    status = db.Column(db.String(30), default='proposed')  # proposed/planning/active/completed
    total_complaints = db.Column(db.Integer, default=0)
    total_citizens_affected = db.Column(db.Integer, default=0)
    estimated_budget = db.Column(db.String(100), nullable=True)
    timeline = db.Column(db.String(100), nullable=True)
    department = db.Column(db.String(100), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, onupdate=datetime.utcnow)
    # complaints relationship populated via backref from Complaint.initiative_id
