# config.py
import os
from dotenv import load_dotenv

# Load variables from .env file
load_dotenv()

class Config:
    """
    Application Configuration Loader.
    Ensures secure access to IBM watsonx.ai keys and sets defaults for local development.
    """
    SECRET_KEY = os.getenv("FLASK_SECRET_KEY", "dev-secret-admission-key-1234")
    FLASK_ENV = os.getenv("FLASK_ENV", "development")

    # Google Gemini AI Credentials
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
    
    # Gemini Model ID Configuration
    # Fallback to standard Gemini Flash if not specified
    GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

    # Local paths
    BASE_DIR = os.path.abspath(os.path.dirname(__file__))
    KNOWLEDGE_BASE_PATH = os.path.join(BASE_DIR, "vfstr_knowledge.json")
