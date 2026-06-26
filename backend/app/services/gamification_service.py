from app.models.user import User, BADGE_THRESHOLDS
from app.models.badge import Badge
from app.extensions import db
from .notification_service import create_notification

POINT_EVENTS = {
    'complaint_submitted':       10,
    'complaint_approved':        20,
    'complaint_resolved':        50,
    'verification_contributed':  10,
    'evidence_contributed':      15,
}

BADGES = [
    ('Reporter',        0),
    ('Community Voice', 100),
    ('Change Maker',    300),
    ('Civic Guardian',  600),
    ('Civic Hero',      1000),
    ('Civic Legend',    2000),
]


def compute_badge(points: int) -> str:
    badge = 'Reporter'
    for name, threshold in BADGES:
        if points >= threshold:
            badge = name
    return badge


def award_points(user_id: int, points_or_event, reason: str = ''):
    """
    Award points to a user and check for badge upgrades.

    Accepts:
        award_points(user_id, 10, 'reason')         – legacy raw-points call
        award_points(user_id, 'complaint_resolved')  – event-key call
    """
    user = User.query.get(user_id)
    if not user:
        return

    # Resolve points value
    if isinstance(points_or_event, str):
        points = POINT_EVENTS.get(points_or_event, 0)
    else:
        points = int(points_or_event)

    if points == 0:
        return

    old_badge = user.get_badge()
    user.points += points
    new_badge = user.get_badge()
    user.current_badge = new_badge

    if new_badge != old_badge:
        db.session.add(Badge(user_id=user_id, badge_name=new_badge))
        create_notification(
            user_id=user_id,
            title='New Badge Unlocked! 🏆',
            message=f"You've earned the '{new_badge}' badge! Keep contributing to your community.",
            type='badge',
        )

    db.session.commit()
