# utils.py
from datetime import datetime

def format_currency(val):
    """Formats an integer value into Indian Rupees format (INR)."""
    try:
        return f"₹{int(val):,}"
    except (ValueError, TypeError):
        return f"₹{val}"

def format_timestamp(ts_str=None):
    """Formats the current date and time or a specific timestamp string."""
    if not ts_str:
        return datetime.now().strftime("%Y-%m-%d %I:%M %p")
    try:
        dt = datetime.strptime(ts_str, "%Y-%m-%d %H:%M:%S")
        return dt.strftime("%b %d, %Y %I:%M %p")
    except ValueError:
        return ts_str

def export_chat_history(session_id, chat_logs):
    """
    Formatically compiles a session transcript into a downloadable Markdown report
    for counselling references.
    """
    output = f"# VFSTR Smart Admission Chat Log Transcript\n"
    output += f"Session Reference ID: {session_id}\n"
    output += f"Export Date: {datetime.now().strftime('%Y-%m-%d %I:%M %p')}\n"
    output += "="*40 + "\n\n"
    
    for log in chat_logs:
        timestamp = format_timestamp(log.get("timestamp"))
        output += f"### [{timestamp}] Student Query:\n"
        output += f"> {log.get('user_query')}\n\n"
        output += f"### Assistant Response:\n"
        output += f"{log.get('bot_response')}\n\n"
        output += "-"*40 + "\n\n"
        
    return output
