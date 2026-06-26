from app.models.notification import Notification
from app.extensions import db


def create_notification(user_id: int, title: str, message: str,
                        type: str = 'info', complaint_id: int = None) -> Notification:
    n = Notification(
        user_id=user_id,
        title=title,
        message=message,
        type=type,
        complaint_id=complaint_id,
    )
    db.session.add(n)
    db.session.commit()
    return n


# Alias used by pipeline and admin routes
def notify(user_id: int, title: str, message: str,
           complaint_id: int = None, type: str = 'system') -> Notification:
    return create_notification(
        user_id=user_id,
        title=title,
        message=message,
        type=type,
        complaint_id=complaint_id,
    )


def notify_badge_earned(user_id: int, badge_name: str):
    create_notification(
        user_id=user_id,
        title=f'🏆 New Badge Earned: {badge_name}!',
        message=(
            f'Congratulations! You have earned the {badge_name} badge '
            f'for your civic contributions.'
        ),
        type='badge',
    )
