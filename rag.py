# rag.py
import json
import re
import math
from config import Config

class RAGSystem:
    """
    Lightweight Retrieval-Augmented Generation (RAG) search engine.
    Loads, tokenizes, indexes, and retrieves context from vfstr_knowledge.json
    using TF-IDF-based term matching.
    """
    def __init__(self, knowledge_base_path=None):
        self.knowledge_base_path = knowledge_base_path or Config.KNOWLEDGE_BASE_PATH
        self.documents = []
        self.load_and_index()

    def _tokenize(self, text):
        """Tokenize text into lowercase alphabetic words."""
        return re.findall(r'\b[a-z0-9]+\b', text.lower())

    def load_and_index(self):
        """
        Parses the structured JSON knowledge base and flattens it into text documents
        suitable for retrieval indexing.
        """
        try:
            with open(self.knowledge_base_path, 'r', encoding='utf-8') as f:
                kb = json.load(f)
        except Exception as e:
            print(f"Error loading knowledge base: {e}")
            return

        docs = []

        # 1. Index University Info
        info = kb.get("university_info", {})
        docs.append({
          "category": "general",
          "text": f"University Name: {info.get('name')}. Location: {info.get('location')}. Accreditation: {info.get('accreditation')}. Admissions Helpdesk: Phone {info.get('contact', {}).get('phone')}, Email {info.get('contact', {}).get('email')}, Website {info.get('contact', {}).get('website')}.",
          "keywords": ["contact", "phone", "email", "website", "address", "location", "vignan", "vfstr", "where"]
        })

        # 2. Index Admission Timeline
        for timeline in kb.get("admission_timeline_2026", []):
            docs.append({
                "category": "dates",
                "text": f"Admission Event: {timeline.get('event')}. Date: {timeline.get('date')}. Details: {timeline.get('details')}.",
                "keywords": ["dates", "timeline", "when", "start", "end", "deadline", "calendar", "exam date", "schedule", "counselling date", "vsat dates"]
            })

        # 3. Index Admission Steps
        steps_info = kb.get("admission_process", {})
        for step in steps_info.get("steps", []):
            docs.append({
                "category": "process",
                "text": f"Admission Step {step.get('step')}: {step.get('name')}. Details: {step.get('description')}",
                "keywords": ["steps", "process", "apply", "register", "admission procedure", "how to apply", "registration", "counselling", "application fee", "allotment"]
            })

        # 3b. Index Required Documents
        docs.append({
            "category": "documents",
            "text": "Required Documents Checklist for VFSTR Admissions/Counselling: " + ", ".join(steps_info.get("required_documents", [])),
            "keywords": ["documents", "certificates", "marksheet", "checklist", "tc", "transfer certificate", "bonafide", "ssc", "intermediate", "caste certificate", "what documents"]
        })

        # 4. Index Courses
        for course in kb.get("courses", []):
            fee_a = f"₹{course.get('annual_fee_category_a'):,}"
            fee_b = f"₹{course.get('annual_fee_category_b'):,}"
            text = (
                f"Course: {course.get('name')} ({course.get('degree')}). "
                f"Duration: {course.get('duration')}. Stream: {course.get('stream')}. "
                f"Eligibility Criteria: {course.get('eligibility')} "
                f"Annual Tuition Fee (Category A): {fee_a}. "
                f"Annual Tuition Fee (Category B): {fee_b}. "
                f"Course Description: {course.get('description')} "
                f"Career Scope & Job Opportunities: {course.get('career_scope')}"
            )
            docs.append({
                "category": "courses",
                "text": text,
                "keywords": [
                    course.get("name").lower(), course.get("degree").lower(), course.get("id").lower(),
                    "fee", "tuition", "duration", "eligibility", "stream", "jobs", "career", "scope",
                    "cse", "ece", "biotech", "agriculture", "mba", "mca", "bpharmacy", "phd"
                ]
            })

        # 5. Index Scholarships
        sch = kb.get("scholarships", {})
        docs.append({
            "category": "scholarships",
            "text": f"Scholarships Overview: {sch.get('description')}",
            "keywords": ["scholarships", "financial aid", "concession", "fee waiver", "free seat", "merit"]
        })
        for slab in sch.get("btech_VSAT_slabs", []):
            text = (
                f"Scholarship Slab: {slab.get('slab')}. "
                f"Required V-SAT Rank: {slab.get('vsat_rank')}. "
                f"JEE Main Percentile: {slab.get('jee_percentile')}. "
                f"EAPCET/EAMCET Rank: {slab.get('eapcet_rank')}. "
                f"Intermediate Board Marks: {slab.get('inter_marks')}."
            )
            docs.append({
                "category": "scholarships",
                "text": text,
                "keywords": ["scholarship", "vsat rank", "jee main", "eapcet", "eamcet", "marks", "slab", "percentage", "intermediate"]
            })
        docs.append({
            "category": "scholarships",
            "text": "Scholarship Maintenance Rules: " + " ".join(sch.get("general_rules", [])),
            "keywords": ["scholarship rules", "cgpa", "backlogs", "maintenance", "retain"]
        })

        # 6. Index Hostels
        hostels = kb.get("hostels", {})
        boys = hostels.get("boys", {})
        girls = hostels.get("girls", {})
        docs.append({
            "category": "hostel",
            "text": (
                f"Boys Hostel: {boys.get('name')} (Capacity {boys.get('capacity')}). "
                f"Non-AC Annual Fee: ₹{boys.get('non_ac_fee_annual'):,}. AC Annual Fee: ₹{boys.get('ac_fee_annual'):,}. "
                f"Girls Hostel: {girls.get('name')} (Capacity {girls.get('capacity')}). "
                f"Non-AC Annual Fee: ₹{girls.get('non_ac_fee_annual'):,}. AC Annual Fee: ₹{girls.get('ac_fee_annual'):,}."
            ),
            "keywords": ["hostel", "hostel fees", "ac hostel", "non-ac hostel", "boys hostel", "girls hostel", "accommodation", "stay", "rooms", "ntr", "priyamvada"]
        })
        docs.append({
            "category": "hostel",
            "text": "Hostel Amenities and Facilities: " + ", ".join(hostels.get("amenities", [])),
            "keywords": ["hostel facility", "hostel amenities", "food", "mess", "wi-fi", "laundry", "gym", "medical", "ambulance", "sports"]
        })
        docs.append({
            "category": "hostel",
            "text": "Hostel Discipline & Rules: " + " ".join(hostels.get("rules", [])),
            "keywords": ["hostel rules", "curfew", "in-time", "outing", "appliances", "heater", "warden"]
        })

        # 7. Index Placements
        placements = kb.get("placements", {})
        docs.append({
            "category": "placements",
            "text": (
                f"Placements Statistics: Placement Rate is {placements.get('placement_rate')}. "
                f"Highest Package: {placements.get('highest_package')}. "
                f"Average Package: {placements.get('average_package')}. "
                f"Total offers generated: {placements.get('total_offers_2025')}. "
                f"Students Placed: {placements.get('students_placed_2025')}."
            ),
            "keywords": ["placements", "jobs", "salary", "package", "highest package", "average package", "recruiters", "placed rate", "statistics"]
        })
        docs.append({
            "category": "placements",
            "text": "Top Placement Recruiters at VFSTR: " + ", ".join(placements.get("top_recruiters", [])),
            "keywords": ["recruiters", "companies", "tcs", "wipro", "accenture", "cognizant", "infosys", "amazon", "ibm"]
        })
        docs.append({
            "category": "placements",
            "text": "Placement Training Programs: " + " ".join(placements.get("training_programs", [])),
            "keywords": ["crt", "training", "coding workshop", "soft skills", "interviews", "english", "bec"]
        })

        # 8. Index Campus Life
        clife = kb.get("campus_life", {})
        for club in clife.get("clubs", []):
            docs.append({
                "category": "campus_life",
                "text": f"Campus Club: {club.get('name')} ({club.get('type')} Club). Description: {club.get('description')}",
                "keywords": ["clubs", "coding club", "cultural club", "literary club", "e-cell", "entrepreneurship", "extracurricular"]
            })
        for fest in clife.get("festivals", []):
            docs.append({
                "category": "campus_life",
                "text": f"Campus Festival: {fest.get('name')} ({fest.get('type')}). Details: {fest.get('description')}",
                "keywords": ["fest", "festival", "mahotsav", "srujanankura", "events", "celebrations"]
            })
        docs.append({
            "category": "campus_life",
            "text": "Campus Infrastructure: " + " ".join(clife.get("infrastructure", [])),
            "keywords": ["infrastructure", "library", "labs", "sports", "running track", "seminar hall", "canteen", "facilities"]
        })

        # Final Tokenization for TF-IDF indexing
        for idx, doc in enumerate(docs):
            doc["tokens"] = self._tokenize(doc["text"])
            doc["id"] = idx
            self.documents.append(doc)

    def retrieve(self, query, top_n=3):
        """
        Retrieves the top N relevant context snippets matching the query
        using a token intersection and term importance (TF-IDF approximation) score.
        """
        if not self.documents:
            return []

        query_tokens = self._tokenize(query)
        if not query_tokens:
            return []

        scored_docs = []
        for doc in self.documents:
            score = 0
            # Term Frequency of query tokens in doc
            doc_tokens = doc["tokens"]
            doc_token_set = set(doc_tokens)
            doc_text_lower = doc["text"].lower()

            for token in query_tokens:
                # Direct token matching
                tf = doc_tokens.count(token)
                if tf > 0:
                    # Rarity weights: give higher weights to specific key terms
                    weight = 1.5 if token in doc.get("keywords", []) else 1.0
                    score += tf * weight

            # Bonus for phrase match
            clean_query = " ".join(query_tokens)
            if clean_query in doc_text_lower:
                score += 5.0

            # Bonus for exact keyword match in keyword list
            for keyword in doc.get("keywords", []):
                if keyword in query.lower():
                    score += 3.0

            # Normalize by document length to prevent long documents from dominating
            if score > 0:
                length_norm = math.log(1 + len(doc_tokens))
                norm_score = score / length_norm
                scored_docs.append((norm_score, doc["text"]))

        # Sort by score in descending order
        scored_docs.sort(key=lambda x: x[0], reverse=True)

        # Return only the text of top N documents
        return [doc[1] for doc in scored_docs[:top_n]]
