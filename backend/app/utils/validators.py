import re

def validate_email(email: str) -> bool:
    email_regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(email_regex, email))

def validate_coordinates(lat, lng) -> bool:
    try:
        latitude = float(lat)
        longitude = float(lng)
        return -90.0 <= latitude <= 90.0 and -180.0 <= longitude <= 180.0
    except (ValueError, TypeError):
        return False
