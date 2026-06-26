import os
from dotenv import load_dotenv

load_dotenv()


def _db_uri():
    url = os.environ.get('DATABASE_URL', 'sqlite:///civicalign.db')
    # Heroku / some providers still emit "postgres://" — SQLAlchemy 2 requires "postgresql://"
    if url.startswith('postgres://'):
        url = url.replace('postgres://', 'postgresql://', 1)
    return url


def _engine_options():
    url = _db_uri()
    if url.startswith('postgresql'):
        # Neon (and other hosted PG) requires SSL; pass via connect_args
        return {'connect_args': {'sslmode': 'require'}}
    return {}


class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'default-dev-secret-key')
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'default-jwt-secret-key')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = _engine_options()

    UPLOAD_FOLDER = os.environ.get('UPLOAD_FOLDER', 'uploads')
    MAX_CONTENT_LENGTH = int(os.environ.get('MAX_CONTENT_LENGTH', 50 * 1024 * 1024))
    ALLOWED_IMAGE_EXTENSIONS = {'jpg', 'jpeg', 'png'}
    ALLOWED_VIDEO_EXTENSIONS = {'mp4', 'mov'}


class DevelopmentConfig(Config):
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = _db_uri()


class ProductionConfig(Config):
    DEBUG = False
    SQLALCHEMY_DATABASE_URI = _db_uri()


config_by_name = {
    'development': DevelopmentConfig,
    'production':  ProductionConfig,
}
