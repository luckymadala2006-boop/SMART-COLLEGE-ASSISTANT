# watsonx.py
import random
from config import Config
import AGENT_INSTRUCTIONS
from google import genai
from google.genai import types

class WatsonxClient:
    """
    Client wrapper for the AI Model (now powered by Google Gemini).
    Maintains class name 'WatsonxClient' to avoid breaking existing imports.
    """
    def __init__(self):
        self.api_key = Config.GEMINI_API_KEY
        self.model_id = Config.GEMINI_MODEL
        self.is_configured = bool(self.api_key)
        
        self.client = None
        if self.is_configured:
            self.client = genai.Client(api_key=self.api_key)
            
        # Startup diagnostic (no secrets printed)
        print(f"[AI Init] Gemini Configured: {self.is_configured} | Model: {self.model_id}")

    def generate_response(self, query, context_list, chat_history=None):
        """
        Generates a response from the Gemini model.
        Injects the custom system instructions and relevant RAG context.
        """
        system_prompt = AGENT_INSTRUCTIONS.get_system_prompt()
        context_str = "\n".join([f"- {c}" for c in context_list])

        # Check configuration
        if not self.is_configured:
            return "The AI Assistant is currently unavailable because the API key is not configured. Please contact the administrator."

        try:
            # Build the chat history for Gemini
            messages = []
            
            # Inject System Prompt and Context using system_instruction config
            full_system_prompt = f"{system_prompt}\n\nRELEVANT KNOWLEDGE BASE FACTS:\n{context_str}"
            
            # Add past history if provided
            if chat_history:
                for msg in chat_history[-6:]:  # include last 6 messages
                    role = "user" if msg.get("role") == "user" else "model"
                    messages.append(
                        types.Content(
                            role=role,
                            parts=[types.Part.from_text(text=msg.get('content'))]
                        )
                    )
            
            # Add the current query
            messages.append(
                types.Content(
                    role="user",
                    parts=[types.Part.from_text(text=query)]
                )
            )

            config = types.GenerateContentConfig(
                system_instruction=full_system_prompt,
                temperature=0.2, # Low temperature for more factual responses
            )

            response = self.client.models.generate_content(
                model=self.model_id,
                contents=messages,
                config=config
            )
            
            if response.text:
                return response.text.strip()
            else:
                return "I apologize, but I received an empty response. Please try asking your question again."

        except Exception as e:
            print(f"Gemini API Error: {e}")
            return "I apologize, but I am currently experiencing technical difficulties connecting to my AI service. Please try again later."
