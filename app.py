# app.py
# pyrefly: ignore [missing-import]

from flask import Flask
from config import Config
from routes import main_bp, api_bp
import database


def create_app():
    """
    Application Factory to create and configure the Flask app.
    Initializes SQLite tables and registers blueprints.
    """

    app = Flask(__name__)
    app.config.from_object(Config)

    # Initialize Database tables
    with app.app_context():
        database.init_db()

    # Register Blueprints
    app.register_blueprint(main_bp)
    app.register_blueprint(api_bp, url_prefix='/api')

    print("\n" + "=" * 50)
    print(" VFSTR SMART COLLEGE ADMISSION ASSISTANT IS ONLINE ")
    print("=" * 50)

    return app


# Gunicorn entry point
app = create_app()


# Local development
if __name__ == '__main__':
    app.run(
        host='0.0.0.0',
        port=5000,
        debug=True
    )
