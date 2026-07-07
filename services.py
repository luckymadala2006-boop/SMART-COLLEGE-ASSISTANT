# services.py
from rag import RAGSystem
from watsonx import WatsonxClient
import database

class AdmissionAssistantService:
    """
    Orchestrator Service combining RAG retrieval and Watsonx.ai LLM execution.
    Handles conversation logs and profile contextual searches.
    """
    def __init__(self):
        self.rag = RAGSystem()
        self.watsonx = WatsonxClient()

    def process_student_query(self, session_id, email, query, chat_history=None):
        """
        Runs the RAG-Granite pipeline:
        1. Query similarity retrieval from JSON knowledge base.
        2. Context construction.
        3. LLM response generation via IBM watsonx.ai.
        4. DB Logging of conversation and searches.
        """
        # Save query in student's search logs if logged in
        if email:
            database.add_recent_search(email, query)

        # Retrieve relevant contexts
        context_snippets = self.rag.retrieve(query, top_n=3)

        # Generate response using IBM Watsonx
        response = self.watsonx.generate_response(query, context_snippets, chat_history)

        # Log conversation transaction to DB
        database.log_chat(session_id, query, response)

        return {
            "response": response,
            "context": context_snippets,
            "is_live_watsonx": self.watsonx.is_configured
        }

    def check_eligibility(self, data):
        """
        Checks student eligibility based on input scores and suggests courses.
        """
        stream = data.get("stream", "MPC")  # MPC, BiPC, Commerce, etc.
        marks_12th = float(data.get("marks_12th", 0))
        exam = data.get("exam", "V-SAT")  # V-SAT, JEE Main, EAMCET, None
        rank = float(data.get("rank", 999999))
        interest = data.get("interest", "").lower()

        eligible_programs = []
        suggestions = []

        # Minimum criteria: 60% in Class 12
        if marks_12th < 60.0:
            return {
                "eligible": False,
                "programs": [],
                "suggestions": [
                    "We require a minimum of 60% aggregate marks in 10+2 / Intermediate for B.Tech and B.Pharmacy admissions.",
                    "If you have completed Class 12 in humanities/arts, you may explore non-engineering streams, or reach out to the admissions cell for Category B options."
                ]
            }

        # Check courses in VFSTR knowledge base
        courses = self.rag.retrieve(interest, top_n=10) if interest else []
        
        # Pull course list from DB
        import json
        with open(self.rag.knowledge_base_path, 'r', encoding='utf-8') as f:
            kb = json.load(f)
            all_courses = kb.get("courses", [])

        # Recommendation Logic
        for course in all_courses:
            c_stream = course.get("stream", "Engineering")
            c_degree = course.get("degree")

            # Check academic stream match
            if stream == "BiPC":
                # Biology student
                if c_stream in ["Agriculture", "Pharmacy"] or course["id"] == "btech-biotech":
                    eligible_programs.append(course)
            else:
                # Math student (MPC)
                if c_stream == "Engineering" or c_stream == "Pharmacy":
                    eligible_programs.append(course)
                elif c_stream == "Management" and c_degree in ["BBA", "BCA", "MBA", "MCA"]:
                    eligible_programs.append(course)
            
            # Post-grad conditions
            if stream == "Graduation":
                if c_degree in ["M.Tech", "MBA", "MCA", "PhD"]:
                    eligible_programs.append(course)

        # Scholarship potential based on rank
        scholarship_note = "Standard Category A tuition fees apply."
        if exam == "V-SAT":
            if rank <= 100:
                scholarship_note = "🎉 Eligible for a 100% Tuition Fee Scholarship based on your V-SAT Rank!"
            elif rank <= 500:
                scholarship_note = "🎉 Eligible for a 50% Tuition Fee Scholarship based on your V-SAT Rank!"
            elif rank <= 2000:
                scholarship_note = "🎉 Eligible for a 25% Tuition Fee Scholarship based on your V-SAT Rank!"
            elif rank <= 5000:
                scholarship_note = "🎉 Eligible for a 10% Tuition Fee Scholarship based on your V-SAT Rank!"
        elif exam == "JEE Main":
            # Assume rank represents percentile here (e.g. 99)
            if rank >= 98:
                scholarship_note = "🎉 Eligible for a 100% Tuition Fee Scholarship based on your JEE Main Percentile!"
            elif rank >= 95:
                scholarship_note = "🎉 Eligible for a 50% Tuition Fee Scholarship based on your JEE Main Percentile!"
            elif rank >= 90:
                scholarship_note = "🎉 Eligible for a 25% Tuition Fee Scholarship based on your JEE Main Percentile!"

        suggestions.append(scholarship_note)
        suggestions.append("Please register for the Vignan Counselling session with your JEE/VSAT rank card.")

        # Limit programs lists
        return {
            "eligible": True,
            "programs": [
                {
                    "name": p["name"],
                    "degree": p["degree"],
                    "fee": f"₹{p['annual_fee_category_a']:,}",
                    "duration": p["duration"],
                    "career": p["career_scope"]
                }
                for p in eligible_programs
            ],
            "suggestions": suggestions
        }
