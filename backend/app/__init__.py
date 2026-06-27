import os
from datetime import timedelta
from flask import Flask, jsonify, send_from_directory
from app.config import config_by_name
from app.extensions import db, jwt, cors, migrate
from app.routes import (
    auth_bp, complaints_bp, community_bp, admin_bp,
    ai_bp, analytics_bp, reports_bp, notifications_bp
)

def create_app(config_name=None):
    if not config_name:
        config_name = os.environ.get('FLASK_ENV', 'development')

    app = Flask(__name__)
    
    # Load configuration
    app.config.from_object(config_by_name[config_name])
    
    # Configure JWT
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)
    
    # Initialize extensions
    cors.init_app(app, resources={r"/*": {"origins": "*"}})
    db.init_app(app)
    jwt.init_app(app)
    migrate.init_app(app, db)
    
    # Health check route
    @app.route('/api/health', methods=['GET'])
    def health_check():
        return jsonify({"status": "ok"}), 200

    # Serve uploaded files
    @app.route('/uploads/<path:filename>', methods=['GET'])
    def serve_upload(filename):
        # Handle cases where duplicate "uploads/" is prepended in the path
        if filename.startswith('uploads/'):
            filename = filename.replace('uploads/', '', 1)
        return send_from_directory(os.path.abspath(app.config['UPLOAD_FOLDER']), filename)



    # Register blueprints under the /api prefix
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(complaints_bp, url_prefix='/api/complaints')
    app.register_blueprint(community_bp, url_prefix='/api/community')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    app.register_blueprint(ai_bp, url_prefix='/api/ai')
    app.register_blueprint(analytics_bp, url_prefix='/api/analytics')
    app.register_blueprint(reports_bp, url_prefix='/api/reports')
    app.register_blueprint(notifications_bp, url_prefix='/api/notifications')

    # Error handlers
    @app.errorhandler(400)
    def bad_request(error):
        return jsonify({"error": "Bad request", "message": str(error)}), 400

    @app.errorhandler(401)
    def unauthorized(error):
        return jsonify({"error": "Unauthorized", "message": str(error)}), 401

    @app.errorhandler(403)
    def forbidden(error):
        return jsonify({"error": "Forbidden", "message": str(error)}), 403

    @app.errorhandler(404)
    def not_found(error):
        return jsonify({"error": "Not found", "message": "The requested resource could not be found."}), 404

    @app.errorhandler(500)
    def internal_server_error(error):
        return jsonify({"error": "Internal server error", "message": "An unexpected error occurred."}), 500

    return app
