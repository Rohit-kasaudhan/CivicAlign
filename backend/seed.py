"""
Seed script — run once to populate the database with demo data.

Usage:
    cd backend
    python seed.py
"""

import os, sys
os.environ.setdefault('FLASK_ENV', 'development')

from app import create_app
from app.extensions import db
from app.models.user import User
from app.models.complaint import Complaint
from app.models.initiative import Initiative
from app.services.gamification_service import award_points

app = create_app()


CITIZENS = [
    {'full_name': 'Priya Sharma',   'email': 'priya@example.com',   'city': 'Mumbai',    'state': 'Maharashtra', 'country': 'India'},
    {'full_name': 'Rahul Verma',    'email': 'rahul@example.com',   'city': 'Delhi',     'state': 'Delhi',       'country': 'India'},
    {'full_name': 'Anjali Patel',   'email': 'anjali@example.com',  'city': 'Ahmedabad', 'state': 'Gujarat',     'country': 'India'},
    {'full_name': 'Suresh Kumar',   'email': 'suresh@example.com',  'city': 'Bangalore', 'state': 'Karnataka',   'country': 'India'},
    {'full_name': 'Meena Iyer',     'email': 'meena@example.com',   'city': 'Chennai',   'state': 'Tamil Nadu',  'country': 'India'},
]

COMPLAINTS = [
    {
        'title': 'Large pothole on MG Road causing accidents',
        'description': 'There is a massive pothole near the MG Road signal that has caused two bike accidents this week. It needs immediate attention.',
        'category': 'Roads', 'priority': 'critical', 'status': 'in_progress',
        'city': 'Bangalore', 'state': 'Karnataka', 'country': 'India',
        'latitude': 12.9716, 'longitude': 77.5946,
        'impact_score': 82.0, 'trust_score': 75.0,
        'responsible_department': 'BBMP Roads',
    },
    {
        'title': 'Overflowing drain near Dadar station',
        'description': 'The drainage system near Dadar station has been overflowing for 3 days. The sewage is flowing onto the footpath.',
        'category': 'Drainage', 'priority': 'high', 'status': 'approved',
        'city': 'Mumbai', 'state': 'Maharashtra', 'country': 'India',
        'latitude': 19.0176, 'longitude': 72.8562,
        'impact_score': 71.0, 'trust_score': 65.0,
        'responsible_department': 'BMC Drainage',
    },
    {
        'title': 'Streetlights non-functional on Nehru Marg',
        'description': 'Five consecutive streetlights on Nehru Marg have been out for two weeks. The area is unsafe at night.',
        'category': 'Electricity', 'priority': 'high', 'status': 'community_verified',
        'city': 'Delhi', 'state': 'Delhi', 'country': 'India',
        'latitude': 28.6139, 'longitude': 77.2090,
        'impact_score': 58.0, 'trust_score': 80.0,
        'responsible_department': 'BSES Delhi',
    },
    {
        'title': 'Garbage not collected in Sector 12 for 10 days',
        'description': 'Municipal garbage truck has not visited our sector in 10 days. Waste is piling up and causing health hazard.',
        'category': 'Waste Management', 'priority': 'high', 'status': 'resolved',
        'city': 'Ahmedabad', 'state': 'Gujarat', 'country': 'India',
        'latitude': 23.0225, 'longitude': 72.5714,
        'impact_score': 65.0, 'trust_score': 90.0,
        'responsible_department': 'AMC Sanitation',
    },
    {
        'title': 'Broken water pipeline leaking near school',
        'description': 'A water pipeline near St. Francis School has been leaking for 5 days wasting thousands of litres.',
        'category': 'Water Supply', 'priority': 'medium', 'status': 'assigned',
        'city': 'Chennai', 'state': 'Tamil Nadu', 'country': 'India',
        'latitude': 13.0827, 'longitude': 80.2707,
        'impact_score': 55.0, 'trust_score': 70.0,
        'responsible_department': 'CMWSSB',
    },
    {
        'title': 'Illegal dumping site near Juhu Beach',
        'description': 'Construction debris and plastic waste is being illegally dumped near Juhu Beach causing environmental damage.',
        'category': 'Environment', 'priority': 'medium', 'status': 'under_review',
        'city': 'Mumbai', 'state': 'Maharashtra', 'country': 'India',
        'latitude': 19.0883, 'longitude': 72.8268,
        'impact_score': 60.0, 'trust_score': 55.0,
    },
    {
        'title': 'Bus stop shelter collapsed on Ring Road',
        'description': 'The bus stop shelter on Ring Road collapsed after heavy rain. Commuters are stranded in the open.',
        'category': 'Transportation', 'priority': 'high', 'status': 'submitted',
        'city': 'Delhi', 'state': 'Delhi', 'country': 'India',
        'latitude': 28.5355, 'longitude': 77.3910,
        'impact_score': 50.0, 'trust_score': 40.0,
    },
    {
        'title': 'Open manhole in residential area',
        'description': 'A manhole cover on Residency Road has been missing for 3 days. Children and elderly are at risk of falling.',
        'category': 'Public Safety', 'priority': 'critical', 'status': 'ai_processed',
        'city': 'Bangalore', 'state': 'Karnataka', 'country': 'India',
        'latitude': 12.9784, 'longitude': 77.6408,
        'impact_score': 88.0, 'trust_score': 35.0,
    },
    {
        'title': 'Flooding in low-lying area during monsoon',
        'description': 'Every monsoon, three streets flood knee-deep for 2-3 days. Need permanent drainage solution.',
        'category': 'Drainage', 'priority': 'critical', 'status': 'resolved',
        'city': 'Chennai', 'state': 'Tamil Nadu', 'country': 'India',
        'latitude': 13.0604, 'longitude': 80.2496,
        'impact_score': 91.0, 'trust_score': 95.0,
        'responsible_department': 'Greater Chennai Corporation',
    },
    {
        'title': 'Broken playground equipment in public park',
        'description': 'The swing set in Vastrapur Lake Park has a broken chain. Two children were injured last week.',
        'category': 'Public Safety', 'priority': 'medium', 'status': 'closed',
        'city': 'Ahmedabad', 'state': 'Gujarat', 'country': 'India',
        'latitude': 23.0389, 'longitude': 72.5290,
        'impact_score': 45.0, 'trust_score': 85.0,
        'responsible_department': 'AMC Parks',
    },
]

INITIATIVES = [
    {
        'title': 'Smart Road Repair Drive — Bangalore 2025',
        'description': 'A city-wide initiative to repair and resurface the top 50 most-reported pothole-prone roads before monsoon 2025.',
        'category': 'Roads',
        'department': 'BBMP Roads',
        'status': 'active',
    },
    {
        'title': 'Zero Open Drains — Mumbai Monsoon Preparedness',
        'description': 'Systematic inspection and repair of all open and overflowing drains across Mumbai before the monsoon season.',
        'category': 'Drainage',
        'department': 'BMC Drainage',
        'status': 'proposed',
    },
]


def seed():
    with app.app_context():
        # Safety guard — don't re-seed if data exists
        if User.query.filter_by(email='admin@civicalign.com').first():
            print('Seed already applied. Skipping.')
            return

        print('Seeding database…')

        # ── Admin ──────────────────────────────────────────────────────────
        admin = User(
            full_name='CivicAlign Admin',
            email='admin@civicalign.com',
            role='admin',
            city='New Delhi',
            state='Delhi',
            country='India',
            is_verified=True,
        )
        admin.set_password('Admin@123')
        db.session.add(admin)

        # ── Citizens ───────────────────────────────────────────────────────
        citizens = []
        for c in CITIZENS:
            u = User(role='citizen', is_verified=True, **c)
            u.set_password('Test@1234')
            db.session.add(u)
            citizens.append(u)

        db.session.flush()   # get IDs

        # ── Complaints ────────────────────────────────────────────────────
        for i, cd in enumerate(COMPLAINTS):
            owner = citizens[i % len(citizens)]
            comp = Complaint(submitted_by=owner.id, **cd)
            db.session.add(comp)

        # ── Initiatives ────────────────────────────────────────────────────
        for id_ in INITIATIVES:
            ini = Initiative(**id_)
            db.session.add(ini)

        db.session.commit()

        # ── Award points so badges unlock ─────────────────────────────────
        for u in citizens:
            award_points(u.id, 50, 'Seed bonus')

        print('[OK] Admin:    admin@civicalign.com  /  Admin@123')
        print('[OK] Citizens: priya/rahul/anjali/suresh/meena @example.com  /  Test@1234')
        print(f'[OK] {len(COMPLAINTS)} complaints, {len(INITIATIVES)} initiatives created')
        print('Seed complete.')


if __name__ == '__main__':
    seed()
