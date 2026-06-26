import os
import secrets
import requests as http_requests

from flask import Blueprint, jsonify, request
from flask_jwt_extended import (
    create_access_token, jwt_required, get_jwt_identity, decode_token
)
import random
import string
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash

from app.extensions import db
from app.models.user import User

auth_bp = Blueprint('auth', __name__)

VALID_LANGUAGES = {
    'en', 'hi', 'mr', 'bn', 'ta', 'te', 'gu', 'pa',
    'ur', 'ar', 'fr', 'de', 'es', 'zh', 'ja', 'ko', 'ru'
}


@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json() or {}

    required = ['full_name', 'email', 'password']
    for field in required:
        if not data.get(field, '').strip():
            return jsonify({'error': f'{field} is required'}), 400

    if User.query.filter_by(email=data['email'].lower().strip()).first():
        return jsonify({'error': 'Email is already registered'}), 400

    user = User(
        full_name=data['full_name'].strip(),
        email=data['email'].lower().strip(),
        phone=data.get('phone', '').strip() or None,
        country=data.get('country', '').strip() or None,
        state=data.get('state', '').strip() or None,
        city=data.get('city', '').strip() or None,
        role='citizen',
    )
    user.set_password(data['password'])

    db.session.add(user)
    db.session.commit()

    token = create_access_token(identity=str(user.id))
    return jsonify({'access_token': token, 'user': user.to_dict()}), 201


@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    email = data.get('email', '').lower().strip()
    password = data.get('password', '')

    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400

    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return jsonify({'error': 'Invalid email or password'}), 401

    if not user.is_active:
        return jsonify({'error': 'Account is deactivated'}), 401

    token = create_access_token(identity=str(user.id))
    return jsonify({'access_token': token, 'user': user.to_dict()}), 200


@auth_bp.route('/admin/login', methods=['POST'])
def admin_login():
    data = request.get_json() or {}
    email = data.get('email', '').lower().strip()
    password = data.get('password', '')

    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400

    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return jsonify({'error': 'Invalid email or password'}), 401

    if user.role != 'admin':
        return jsonify({'error': 'Access denied. Admin credentials required.'}), 403

    if not user.is_active:
        return jsonify({'error': 'Account is deactivated'}), 401

    token = create_access_token(identity=str(user.id))
    return jsonify({'access_token': token, 'user': user.to_dict()}), 200


@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_me():
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))
    if not user:
        return jsonify({'error': 'User not found'}), 404
    return jsonify({'user': user.to_dict()}), 200


@auth_bp.route('/language', methods=['PUT'])
@jwt_required()
def update_language():
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))
    if not user:
        return jsonify({'error': 'User not found'}), 404

    data = request.get_json() or {}
    language = data.get('language', '').strip()

    if language not in VALID_LANGUAGES:
        return jsonify({'error': f'Invalid language code. Valid codes: {sorted(VALID_LANGUAGES)}'}), 400

    user.preferred_language = language
    db.session.commit()

    return jsonify({'user': user.to_dict()}), 200


@auth_bp.route('/google', methods=['POST'])
def google_login():
    data         = request.get_json() or {}
    access_token = data.get('access_token', '').strip()

    if not access_token:
        return jsonify({'error': 'access_token is required'}), 400

    # Verify token and fetch profile from Google
    resp = http_requests.get(
        'https://www.googleapis.com/oauth2/v3/userinfo',
        headers={'Authorization': f'Bearer {access_token}'},
        timeout=10,
    )
    if resp.status_code != 200:
        return jsonify({'error': 'Invalid or expired Google token'}), 401

    info  = resp.json()
    email = info.get('email', '').lower().strip()
    name  = info.get('name') or info.get('given_name') or email.split('@')[0]

    if not email:
        return jsonify({'error': 'Google account has no email address'}), 400

    # Find existing user or create a new one
    user = User.query.filter_by(email=email).first()
    if not user:
        # OAuth users get a random unguessable password hash so the column stays non-null
        random_pw = generate_password_hash(secrets.token_hex(32))
        user = User(
            full_name=name,
            email=email,
            password_hash=random_pw,
            role='citizen',
            is_verified=True,   # Google already verified their email
            preferred_language='en',
        )
        db.session.add(user)
        db.session.commit()

        # Seed starter points for new Google sign-ups
        from app.services.gamification_service import award_points
        award_points(user.id, 10, 'Joined via Google')

    if not user.is_active:
        return jsonify({'error': 'Account is deactivated'}), 401

    jwt_token = create_access_token(identity=str(user.id))
    return jsonify({'access_token': jwt_token, 'user': user.to_dict()}), 200


@auth_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))
    if not user:
        return jsonify({'error': 'User not found'}), 404

    data = request.get_json() or {}

    if 'full_name' in data:
        val = data['full_name'].strip()
        if not val:
            return jsonify({'error': 'full_name cannot be empty'}), 400
        user.full_name = val

    for field in ('phone', 'country', 'state', 'city'):
        if field in data:
            user.__setattr__(field, data[field].strip() or None)

    db.session.commit()
    return jsonify({'user': user.to_dict()}), 200


@auth_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_stats():
    from app.models.complaint import Complaint
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    total    = Complaint.query.filter_by(submitted_by=user_id).count()
    approved = Complaint.query.filter(
        Complaint.submitted_by == user_id,
        Complaint.status.in_(['approved', 'assigned', 'in_progress', 'resolved', 'closed']),
    ).count()
    resolved = Complaint.query.filter(
        Complaint.submitted_by == user_id,
        Complaint.status.in_(['resolved', 'closed']),
    ).count()

    return jsonify({
        'total': total,
        'approved': approved,
        'resolved': resolved,
        'points': user.points,
        'current_badge': user.current_badge,
        'member_since': user.created_at.isoformat() if user.created_at else None,
    }), 200


@auth_bp.route('/badges', methods=['GET'])
@jwt_required()
def get_badges():
    from app.models.badge import Badge
    user_id = int(get_jwt_identity())
    badges = Badge.query.filter_by(user_id=user_id).order_by(Badge.earned_at.asc()).all()
    return jsonify({
        'badges': [
            {
                'badge_name': b.badge_name,
                'earned_at':  b.earned_at.isoformat() if b.earned_at else None,
            }
            for b in badges
        ]
    }), 200


def send_otp_email(to_email, otp):
    mail_server = os.environ.get('MAIL_SERVER', 'smtp.gmail.com')
    mail_port = int(os.environ.get('MAIL_PORT', 587))
    mail_username = os.environ.get('MAIL_USERNAME', 'ksdrohit28@gmail.com')
    mail_password = os.environ.get('MAIL_PASSWORD', 'wzqijrfkyggwgkwz')

    subject = "CivicAlign - Password Recovery OTP"
    body = f"""Hello,

You have requested to reset your password for CivicAlign. Please use the following One-Time Password (OTP) to complete the process:

OTP: {otp}

This OTP is valid for 10 minutes. If you did not request a password reset, please ignore this email.

Best regards,
CivicAlign Team"""

    msg = MIMEMultipart()
    msg['From'] = mail_username
    msg['To'] = to_email
    msg['Subject'] = subject
    msg.attach(MIMEText(body, 'plain'))

    try:
        server = smtplib.SMTP(mail_server, mail_port)
        server.starttls()
        server.login(mail_username, mail_password)
        server.send_message(msg)
        server.quit()
        return True
    except Exception as e:
        print(f"Error sending email: {e}")
        return False


@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    data = request.get_json() or {}
    email = data.get('email', '').lower().strip()

    if not email:
        return jsonify({'error': 'Email is required'}), 400

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({'error': 'No account found with that email'}), 404

    # Generate a 6-digit numeric OTP code
    otp = ''.join(random.choices(string.digits, k=6))
    user.otp_code = otp
    user.otp_expiry = datetime.utcnow() + timedelta(minutes=10)
    db.session.commit()

    # Send the OTP via email
    if not send_otp_email(user.email, otp):
        return jsonify({'error': 'Failed to send OTP email. Please check configuration.'}), 500

    return jsonify({
        'message': 'OTP sent to your email address successfully'
    }), 200


@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    data = request.get_json() or {}
    email = data.get('email', '').lower().strip()
    otp = data.get('otp', '').strip()
    new_password = data.get('new_password', '')

    if not email or not otp or not new_password:
        return jsonify({'error': 'email, otp, and new_password are required'}), 400

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({'error': 'User not found'}), 404

    if not user.otp_code or user.otp_code != otp:
        return jsonify({'error': 'Invalid OTP code'}), 400

    if not user.otp_expiry or user.otp_expiry < datetime.utcnow():
        return jsonify({'error': 'OTP code has expired'}), 400

    user.set_password(new_password)
    user.otp_code = None
    user.otp_expiry = None
    db.session.commit()

    return jsonify({'message': 'Password reset successful'}), 200

