"""
AI routes: sentiment analysis, smart replies, personality analysis, insights
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from jose import JWTError, jwt
import os

from ..database import get_db
from ..models import User, Message, Chat, ChatMember, AIInsight
from ..utils.ai_utils import (
    analyze_sentiment,
    generate_smart_replies,
    analyze_personality,
    get_mood_trends,
    generate_auto_reply
)

router = APIRouter()

SECRET_KEY = os.getenv("SECRET_KEY", "sentio-secret-key-change-in-production")
ALGORITHM = "HS256"


class AnalyzeSentimentRequest(BaseModel):
    text: str
    chat_id: Optional[int] = None


class SmartReplyRequest(BaseModel):
    chat_id: int
    last_message: str
    context_limit: int = 10


class PersonalityRequest(BaseModel):
    target_user_id: int


class AutoReplyRequest(BaseModel):
    chat_id: int
    message: str


def get_user_from_token(token: str, db: Session) -> User:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = int(payload.get("sub"))
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.post("/analyze-sentiment")
async def analyze_sentiment_endpoint(
    request: AnalyzeSentimentRequest,
    token: str,
    db: Session = Depends(get_db)
):
    """Analyze sentiment and emotion of a message"""
    user = get_user_from_token(token, db)
    result = analyze_sentiment(request.text)

    # If chat_id provided, update the message
    if request.chat_id:
        last_msg = db.query(Message).filter(
            Message.chat_id == request.chat_id,
            Message.sender_id != user.id
        ).order_by(Message.created_at.desc()).first()

        if last_msg and not last_msg.ai_analyzed:
            last_msg.sentiment_score = result["sentiment_score"]
            last_msg.emotion = result["emotion"]
            last_msg.ai_analyzed = True
            db.commit()

    return result


@router.post("/smart-replies")
async def get_smart_replies(
    request: SmartReplyRequest,
    token: str,
    db: Session = Depends(get_db)
):
    """Get AI-powered smart reply suggestions"""
    user = get_user_from_token(token, db)

    if not user.ai_suggestions_enabled:
        return {"suggestions": [], "message": "AI suggestions disabled"}

    # Get chat history
    messages = db.query(Message).filter(
        Message.chat_id == request.chat_id
    ).order_by(Message.created_at.desc()).limit(request.context_limit).all()

    chat_history = [
        {
            "sender_id": m.sender_id,
            "content": m.content,
            "emotion": m.emotion,
            "is_me": m.sender_id == user.id
        }
        for m in reversed(messages)
    ]

    suggestions = generate_smart_replies(
        last_message=request.last_message,
        chat_history=chat_history,
        user_personality=user.personality_profile or {}
    )

    return {"suggestions": suggestions}


@router.post("/personality-analysis")
async def analyze_personality_endpoint(
    request: PersonalityRequest,
    token: str,
    db: Session = Depends(get_db)
):
    """Analyze communication personality of a contact"""
    user = get_user_from_token(token, db)

    # Get messages from the target user
    target_messages = db.query(Message).filter(
        Message.sender_id == request.target_user_id
    ).order_by(Message.created_at.desc()).limit(100).all()

    if not target_messages:
        return {
            "personality": {},
            "message": "Not enough data to analyze personality"
        }

    texts = [m.content for m in target_messages if m.content]
    personality = analyze_personality(texts)

    # Save analysis
    target_user = db.query(User).filter(User.id == request.target_user_id).first()
    if target_user:
        target_user.personality_profile = personality
        db.commit()

    return {"personality": personality, "user_id": request.target_user_id}


@router.get("/mood-trends/{user_id}")
async def get_mood_trends_endpoint(
    user_id: int,
    token: str,
    days: int = 30,
    db: Session = Depends(get_db)
):
    """Get mood trends for a user over time"""
    user = get_user_from_token(token, db)

    # Get analyzed messages
    from datetime import datetime, timedelta
    since = datetime.utcnow() - timedelta(days=days)

    messages = db.query(Message).filter(
        Message.sender_id == user_id,
        Message.ai_analyzed == True,
        Message.created_at >= since
    ).all()

    trends = get_mood_trends(messages)
    return {"mood_trends": trends, "days": days}


@router.post("/auto-reply")
async def generate_auto_reply_endpoint(
    request: AutoReplyRequest,
    token: str,
    db: Session = Depends(get_db)
):
    """Generate an auto-reply suggestion for a message"""
    user = get_user_from_token(token, db)

    # Get recent chat history
    messages = db.query(Message).filter(
        Message.chat_id == request.chat_id
    ).order_by(Message.created_at.desc()).limit(5).all()

    context = [{"content": m.content, "is_me": m.sender_id == user.id} for m in reversed(messages)]

    reply = generate_auto_reply(
        message=request.message,
        context=context,
        user_personality=user.personality_profile or {}
    )

    return {"suggested_reply": reply}


@router.get("/dashboard/{user_id}")
async def get_dashboard_insights(
    user_id: int,
    token: str,
    db: Session = Depends(get_db)
):
    """Get comprehensive dashboard insights"""
    user = get_user_from_token(token, db)

    # Get all chats
    chat_members = db.query(ChatMember).filter(ChatMember.user_id == user_id).all()
    chat_ids = [cm.chat_id for cm in chat_members]

    # Message statistics
    total_messages_sent = db.query(Message).filter(
        Message.sender_id == user_id,
        Message.is_deleted == False
    ).count()

    # Top contacts
    from sqlalchemy import func
    top_contacts_raw = db.query(
        Message.sender_id,
        func.count(Message.id).label("msg_count")
    ).filter(
        Message.chat_id.in_(chat_ids),
        Message.sender_id != user_id
    ).group_by(Message.sender_id).order_by(func.count(Message.id).desc()).limit(5).all()

    top_contacts = []
    for contact_id, count in top_contacts_raw:
        contact_user = db.query(User).filter(User.id == contact_id).first()
        if contact_user:
            top_contacts.append({
                "user_id": contact_id,
                "name": contact_user.name or contact_user.phone_number,
                "message_count": count
            })

    # Emotion distribution
    emotion_stats = db.query(
        Message.emotion,
        func.count(Message.id).label("count")
    ).filter(
        Message.sender_id == user_id,
        Message.ai_analyzed == True,
        Message.emotion != None
    ).group_by(Message.emotion).all()

    return {
        "total_messages_sent": total_messages_sent,
        "total_chats": len(chat_ids),
        "top_contacts": top_contacts,
        "emotion_distribution": {e: c for e, c in emotion_stats},
        "best_communication_times": ["Morning (9-11 AM)", "Evening (6-8 PM)"],
        "response_rate": "87%"
    }
