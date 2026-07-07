# database.py
import sqlite3
import os
import json
from datetime import datetime

DB_FILE = "vfstr_admissions.db"

def get_db_connection():
    """Establishes and returns a connection to the SQLite database."""
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initializes the database tables if they do not already exist."""
    conn = get_db_connection()
    cursor = conn.cursor()

    # 1. Student Profiles
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS student_profiles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            phone TEXT,
            education TEXT,
            marks REAL DEFAULT 0.0,
            preferred_course TEXT,
            career_goal TEXT,
            recent_searches TEXT DEFAULT '[]',
            bookmarks TEXT DEFAULT '[]',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # 2. Custom FAQs (Admin Added)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS admin_faqs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            question TEXT UNIQUE NOT NULL,
            answer TEXT NOT NULL,
            category TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # 3. Chat Interaction Logs (for analytics)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS chat_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            session_id TEXT,
            user_query TEXT NOT NULL,
            bot_response TEXT NOT NULL,
            is_helpful INTEGER DEFAULT 0
        )
    """)

    # Populate default FAQs if empty
    cursor.execute("SELECT COUNT(*) FROM admin_faqs")
    if cursor.fetchone()[0] == 0:
        default_faqs = [
            ("When does the V-SAT 2026 application close?", "The V-SAT 2026 application closes on February 25, 2026.", "Timeline"),
            ("What is the B.Tech CSE tuition fee?", "The annual tuition fee for B.Tech CSE (Category A) is ₹3,80,000.", "Fees"),
            ("Is there an AC hostel facility?", "Yes, both NTR Boys Hostel and Priyamvada Girls Hostel offer AC rooms for ₹1,50,000 per year.", "Hostels"),
            ("What is the average placement package?", "The average salary package for placements at VFSTR is around ₹5.5 LPA.", "Placements")
        ]
        cursor.executemany(
            "INSERT INTO admin_faqs (question, answer, category) VALUES (?, ?, ?)",
            default_faqs
        )

    conn.commit()
    conn.close()

# --- Profiles Operations ---

def get_profile(email):
    """Retrieves a student profile by email."""
    conn = get_db_connection()
    row = conn.execute("SELECT * FROM student_profiles WHERE email = ?", (email,)).fetchone()
    conn.close()
    if row:
        profile = dict(row)
        profile["recent_searches"] = json.loads(profile["recent_searches"])
        profile["bookmarks"] = json.loads(profile["bookmarks"])
        return profile
    return None

def save_or_update_profile(email, name, phone=None, education=None, marks=0.0, preferred_course=None, career_goal=None):
    """Creates a new student profile or updates an existing one."""
    conn = get_db_connection()
    profile = get_profile(email)
    
    if profile:
        conn.execute("""
            UPDATE student_profiles
            SET name = ?, phone = ?, education = ?, marks = ?, preferred_course = ?, career_goal = ?
            WHERE email = ?
        """, (name, phone, education, marks, preferred_course, career_goal, email))
    else:
        conn.execute("""
            INSERT INTO student_profiles (email, name, phone, education, marks, preferred_course, career_goal)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (email, name, phone, education, marks, preferred_course, career_goal))
    
    conn.commit()
    conn.close()
    return get_profile(email)

def add_bookmark(email, query, response):
    """Saves a chat Q&A bookmark for a student."""
    profile = get_profile(email)
    if not profile:
        return False
    
    bookmarks = profile.get("bookmarks", [])
    # Check if duplicate
    for bm in bookmarks:
        if bm["query"] == query:
            return True
            
    bookmarks.append({
        "query": query,
        "response": response,
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    })
    
    conn = get_db_connection()
    conn.execute(
        "UPDATE student_profiles SET bookmarks = ? WHERE email = ?",
        (json.dumps(bookmarks), email)
    )
    conn.commit()
    conn.close()
    return True

def remove_bookmark(email, query):
    """Removes a chat bookmark."""
    profile = get_profile(email)
    if not profile:
        return False
    
    bookmarks = [b for b in profile.get("bookmarks", []) if b["query"] != query]
    
    conn = get_db_connection()
    conn.execute(
        "UPDATE student_profiles SET bookmarks = ? WHERE email = ?",
        (json.dumps(bookmarks), email)
    )
    conn.commit()
    conn.close()
    return True

def add_recent_search(email, term):
    """Appends a search term to the student's history, limiting to last 10 entries."""
    profile = get_profile(email)
    if not profile:
        return
        
    searches = profile.get("recent_searches", [])
    if term in searches:
        searches.remove(term)
    searches.insert(0, term)
    searches = searches[:10]  # Cap at 10 items
    
    conn = get_db_connection()
    conn.execute(
        "UPDATE student_profiles SET recent_searches = ? WHERE email = ?",
        (json.dumps(searches), email)
    )
    conn.commit()
    conn.close()

# --- Chat Logging & Analytics ---

def log_chat(session_id, query, response):
    """Logs a user chat conversation for analysis."""
    conn = get_db_connection()
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    conn.execute(
        "INSERT INTO chat_logs (timestamp, session_id, user_query, bot_response) VALUES (?, ?, ?, ?)",
        (now_str, session_id, query, response)
    )
    conn.commit()
    conn.close()

def get_analytics():
    """Retrieves summary dashboard statistics for admin monitoring."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Counts
    cursor.execute("SELECT COUNT(*) FROM chat_logs")
    total_chats = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM student_profiles")
    total_students = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM admin_faqs")
    total_faqs = cursor.fetchone()[0]

    # Recent Logs
    cursor.execute("SELECT * FROM chat_logs ORDER BY id DESC LIMIT 15")
    recent_chats = [dict(row) for row in cursor.fetchall()]

    # Popular queries (mocking a ranking of common words or direct strings)
    cursor.execute("SELECT user_query, COUNT(*) as qty FROM chat_logs GROUP BY user_query ORDER BY qty DESC LIMIT 5")
    popular_queries = [{"query": row["user_query"], "count": row["qty"]} for row in cursor.fetchall()]

    conn.close()
    
    return {
        "total_chats": total_chats,
        "total_students": total_students,
        "total_faqs": total_faqs,
        "recent_chats": recent_chats,
        "popular_queries": popular_queries,
        "system_status": "Healthy"
    }

def add_faq(question, answer, category="General"):
    """Adds a new FAQ item from the admin dashboard."""
    conn = get_db_connection()
    try:
        conn.execute(
            "INSERT INTO admin_faqs (question, answer, category) VALUES (?, ?, ?)",
            (question, answer, category)
        )
        conn.commit()
        success = True
    except sqlite3.IntegrityError:
        success = False
    conn.close()
    return success

def delete_faq(faq_id):
    """Deletes an FAQ item."""
    conn = get_db_connection()
    conn.execute("DELETE FROM admin_faqs WHERE id = ?", (faq_id,))
    conn.commit()
    conn.close()

def get_all_faqs():
    """Gets all FAQs currently in DB."""
    conn = get_db_connection()
    rows = conn.execute("SELECT * FROM admin_faqs ORDER BY id DESC").fetchall()
    conn.close()
    return [dict(row) for row in rows]
