import os
import uuid
from werkzeug.utils import secure_filename
from flask import current_app


MAX_FILE_SIZE = 50 * 1024 * 1024  # 50 MB


def validate_file(file, allowed_extensions: set) -> tuple[bool, str]:
    """Return (ok, error_message). File seek position is reset on return."""
    if not file or not file.filename:
        return False, "No file provided"
    ext = file.filename.rsplit('.', 1)[1].lower() if '.' in file.filename else ''
    if ext not in allowed_extensions:
        return False, f"File type .{ext} not allowed"
    file.seek(0, 2)
    size = file.tell()
    file.seek(0)
    if size > MAX_FILE_SIZE:
        return False, "File too large (max 50 MB)"
    return True, "OK"


def allowed_file(filename: str, allowed_extensions: set) -> bool:
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in allowed_extensions


def save_uploaded_file(file, folder_type: str = 'images') -> str | None:
    if not file or not file.filename:
        return None

    allowed_exts = (
        current_app.config['ALLOWED_IMAGE_EXTENSIONS']
        if folder_type == 'images'
        else current_app.config['ALLOWED_VIDEO_EXTENSIONS']
    )

    if not allowed_file(file.filename, allowed_exts):
        raise ValueError(f"File extension not allowed for {folder_type}.")

    ext = file.filename.rsplit('.', 1)[1].lower()
    unique_name = f"{uuid.uuid4().hex}.{ext}"
    target_dir = os.path.join(current_app.config['UPLOAD_FOLDER'], folder_type)
    os.makedirs(target_dir, exist_ok=True)

    file.save(os.path.join(target_dir, unique_name))
    return f"uploads/{folder_type}/{unique_name}"
