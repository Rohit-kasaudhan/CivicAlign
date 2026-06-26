from app.extensions import db
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash

BADGE_THRESHOLDS = [
    (2000, 'Civic Legend'),
    (1000, 'Civic Hero'),
    (600,  'Civic Guardian'),
    (300,  'Change Maker'),
    (100,  'Community Voice'),
    (0,    'Reporter'),
]


class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    full_name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(150), unique=True, nullable=False, index=True)
    phone = db.Column(db.String(20), nullable=True)
    password_hash = db.Column(db.String(256), nullable=False)
    role = db.Column(db.String(20), default='citizen')  # citizen | admin
    country = db.Column(db.String(100), nullable=True)
    state = db.Column(db.String(100), nullable=True)
    city = db.Column(db.String(100), nullable=True)
    preferred_language = db.Column(db.String(10), default='en')
    is_verified = db.Column(db.Boolean, default=False)
    is_active = db.Column(db.Boolean, default=True)
    avatar_url = db.Column(db.String(256), nullable=True)
    points = db.Column(db.Integer, default=0)
    current_badge = db.Column(db.String(50), default='Reporter')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, onupdate=datetime.utcnow)

    # OTP-based password recovery
    otp_code = db.Column(db.String(6), nullable=True)
    otp_expiry = db.Column(db.DateTime, nullable=True)

    # Relationships
    notifications = db.relationship('Notification', backref='user', lazy=True)
    verifications = db.relationship('Verification', backref='verifier', lazy=True)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def get_badge(self):
        for threshold, badge in BADGE_THRESHOLDS:
            if self.points >= threshold:
                return badge
        return 'Reporter'

    def to_dict(self):
        return {
            'id': self.id,
            'full_name': self.full_name,
            'email': self.email,
            'phone': self.phone,
            'role': self.role,
            'country': self.country,
            'state': self.state,
            'city': self.city,
            'preferred_language': self.preferred_language,
            'is_verified': self.is_verified,
            'is_active': self.is_active,
            'avatar_url': self.avatar_url,
            'points': self.points,
            'current_badge': self.current_badge,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
