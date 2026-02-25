"""
SQLAlchemy ORM models for Sentio
"""
from sqlalchemy import (
    Column, Integer, String, Text, Boolean, DateTime, Float,
    ForeignKey, JSON, Enum as SQLEnum
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from .database import Base


class MessageStatus(str, enum.Enum):
    SENT = "sent"
    DELIVERED = "delivered"
    READ = "read"


class MessageType(str, enum.Enum):
    TEXT = "text"
    IMAGE = "image"
    AUDIO = "audio"
    VIDEO = "video"
    FILE = "file"
    EMOJI = "emoji"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    phone_number = Column(String(20), unique=True, index=True, nullable=False)
    name = Column(String(100))
    profile_picture = Column(String(500))
    mood = Column(String(200))
    bio = Column(Text)
    personality_profile = Column(JSON, default={})
    ai_suggestions_enabled = Column(Boolean, default=True)
    is_active = Column(Boolean, default=True)
    last_seen = Column(DateTime(timezone=True), server_default=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    sent_messages = relationship("Message", foreign_keys="Message.sender_id", back_populates="sender")
    received_messages = relationship("Message", foreign_keys="Message.receiver_id", back_populates="receiver")
    otp_codes = relationship("OTPCode", back_populates="user")
    contacts = relationship("Contact", foreign_keys="Contact.user_id", back_populates="user")
    events = relationship("ImportantEvent", back_populates="user")
    chat_members = relationship("ChatMember", back_populates="user")


class OTPCode(Base):
    __tablename__ = "otp_codes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    phone_number = Column(String(20), nullable=False)
    code = Column(String(10), nullable=False)
    is_used = Column(Boolean, default=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="otp_codes")


class Chat(Base):
    __tablename__ = "chats"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100))
    is_group = Column(Boolean, default=False)
    group_picture = Column(String(500))
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    messages = relationship("Message", back_populates="chat")
    members = relationship("ChatMember", back_populates="chat")


class ChatMember(Base):
    __tablename__ = "chat_members"

    id = Column(Integer, primary_key=True, index=True)
    chat_id = Column(Integer, ForeignKey("chats.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    is_admin = Column(Boolean, default=False)
    joined_at = Column(DateTime(timezone=True), server_default=func.now())

    chat = relationship("Chat", back_populates="members")
    user = relationship("User", back_populates="chat_members")


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    chat_id = Column(Integer, ForeignKey("chats.id"), nullable=False)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    receiver_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    content = Column(Text)
    message_type = Column(SQLEnum(MessageType), default=MessageType.TEXT)
    media_url = Column(String(500))
    status = Column(SQLEnum(MessageStatus), default=MessageStatus.SENT)
    is_deleted = Column(Boolean, default=False)
    reply_to_id = Column(Integer, ForeignKey("messages.id"), nullable=True)

    # AI analysis fields
    sentiment_score = Column(Float)
    emotion = Column(String(50))
    ai_analyzed = Column(Boolean, default=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    sender = relationship("User", foreign_keys=[sender_id], back_populates="sent_messages")
    receiver = relationship("User", foreign_keys=[receiver_id], back_populates="received_messages")
    chat = relationship("Chat", back_populates="messages")
    reply_to = relationship("Message", remote_side=[id])


class Contact(Base):
    __tablename__ = "contacts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    contact_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    nickname = Column(String(100))
    is_blocked = Column(Boolean, default=False)
    is_priority = Column(Boolean, default=False)
    personality_analysis = Column(JSON, default={})
    ai_suggestions_disabled = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", foreign_keys=[user_id], back_populates="contacts")


class ImportantEvent(Base):
    __tablename__ = "important_events"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    contact_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    title = Column(String(200), nullable=False)
    event_type = Column(String(50))  # birthday, anniversary, custom
    event_date = Column(DateTime(timezone=True), nullable=False)
    reminder_days_before = Column(Integer, default=1)
    suggested_message = Column(Text)
    is_recurring = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", foreign_keys=[user_id], back_populates="events")


class AIInsight(Base):
    __tablename__ = "ai_insights"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    insight_type = Column(String(50))  # mood_trend, personality, communication_style
    data = Column(JSON, default={})
    generated_at = Column(DateTime(timezone=True), server_default=func.now())
