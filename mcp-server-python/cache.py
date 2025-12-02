"""
Session Management for MCP Server
Supports file-based session storage for CLI clients
"""

import json
from pathlib import Path
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import logging

logger = logging.getLogger(__name__)

# Session file location
SESSION_FILE = Path.home() / ".synapse" / "session.json"
SESSION_EXPIRY_HOURS = 24


def save_session(data: Dict[str, Any]) -> None:
    """
    Save session to file for CLI clients
    
    Args:
        data: Session data including email, jwt, userId, role, tenantId
    """
    # Create directory if doesn't exist
    SESSION_FILE.parent.mkdir(parents=True, exist_ok=True)
    
    # Add timestamp
    data["created_at"] = datetime.now().isoformat()
    
    # Write JSON to file
    SESSION_FILE.write_text(json.dumps(data, indent=2))
    
    logger.info(f"✅ Session saved for {data.get('email')}")


def load_session() -> Optional[Dict[str, Any]]:
    """
    Load session from file if not expired
    
    Returns:
        Session data dict or None if not found/expired
    """
    # Check if file exists
    if not SESSION_FILE.exists():
        logger.debug("No session file found")
        return None
    
    try:
        # Read and parse JSON
        session = json.loads(SESSION_FILE.read_text())
        
        # Check expiration (24 hours)
        created_at_str = session.get('created_at', '2000-01-01T00:00:00')
        created_at = datetime.fromisoformat(created_at_str)
        age = datetime.now() - created_at
        
        if age > timedelta(hours=SESSION_EXPIRY_HOURS):
            logger.info("⚠️  Session expired (24 hours)")
            delete_session()
            return None
        
        logger.debug(f"Loaded session for {session.get('email')}")
        return session
        
    except Exception as e:
        logger.error(f"❌ Error loading session: {e}")
        return None


def delete_session() -> None:
    """Delete session file"""
    if SESSION_FILE.exists():
        SESSION_FILE.unlink()
        logger.info("🗑️  Session deleted")


def is_session_expired(session: Dict[str, Any]) -> bool:
    """
    Check if session is expired
    
    Args:
        session: Session data dict
        
    Returns:
        True if expired, False otherwise
    """
    created_at_str = session.get('created_at', '2000-01-01T00:00:00')
    created_at = datetime.fromisoformat(created_at_str)
    age = datetime.now() - created_at
    
    return age > timedelta(hours=SESSION_EXPIRY_HOURS)
