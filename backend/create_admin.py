"""
Run once to create the admin user:
    python create_admin.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from app import create_app
from app.extensions import db
from app.models.user import User

app = create_app('development')

with app.app_context():
    # Create tables if they don't exist yet
    db.create_all()

    email = 'admin@civicalign.com'
    existing = User.query.filter_by(email=email).first()

    if existing:
        print(f'Admin already exists: {email}')
    else:
        admin = User(
            full_name='CivicAlign Admin',
            email=email,
            role='admin',
            city='New Delhi',
            country='India',
            is_verified=True,
            is_active=True,
        )
        admin.set_password('Admin@1234')
        db.session.add(admin)
        db.session.commit()
        print('Admin user created successfully.')

    print('\n--- Admin Login Credentials ---')
    print('Email   : admin@civicalign.com')
    print('Password: Admin@1234')
    print('URL     : http://localhost:5173/login')
    print('-------------------------------')
