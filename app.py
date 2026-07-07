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

    return app

# Development entry point
if __name__ == '__main__':
    app = create_app()
    # Print status check
    print("\n" + "="*50)
    print("  VFSTR SMART COLLEGE ADMISSION ASSISTANT IS ONLINE  ")
    print(f"Flask Mode: {app.config['FLASK_ENV']}")
    print(f"Gemini AI Service Configured: {bool(app.config.get('GEMINI_API_KEY'))}")
    print("Running locally at: http://127.0.0.1:5000")
    print("="*50 + "\n")
    app.run(host='0.0.0.0', port=5000, debug=True)
def create_app():
    app = Flask(__name__)
    ...
    return app

app = create_app()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
