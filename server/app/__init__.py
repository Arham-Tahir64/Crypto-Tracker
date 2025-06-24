# server/app/__init__.py
# This file contains the Flask application factory.

from flask import Flask
from dotenv import load_dotenv # Import to load environment variables from .env
import os # Import for accessing environment variables
from flask_jwt_extended import JWTManager
from .models import db  # Import db from models.py
from .routes import main_bp

def create_app():
    # Load environment variables from the .env file
    # This should be called before accessing any os.getenv() variables.
    load_dotenv()

    app = Flask(__name__)

    # --- Application Configuration ---

    # Database configuration
    # Get the database URI from environment variables for flexibility.
    # Provide a fallback to SQLite for local development if DB_URI is not set.
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URI', 'sqlite:///site.db')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False # Suppresses a warning

    # Flask Secret Key for session management and other security features.
    # Get from environment variables. This MUST be set for Flask apps.
    app.config['SECRET_KEY'] = os.getenv('FLASK_SECRET_KEY', 'dev-secret-key') # Default for local dev

    # JWT Secret Key for signing and verifying JSON Web Tokens.
    # Get from environment variables. This MUST be a strong, unique, and secret key.
    app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'dev-jwt-secret-key') # Default for local dev

    # --- Initialize Extensions with the Flask App ---

    # Initialize SQLAlchemy with the Flask app instance
    db.init_app(app)

    # Initialize Flask-JWT-Extended with the Flask app instance
    jwt = JWTManager(app)

    # --- Register Blueprints ---
    # Register the main_bp blueprint, which contains all your API routes.
    # The url_prefix defined on the blueprint (e.g., '/api') will be applied here.
    app.register_blueprint(main_bp)

    return app
