# app/models/chat.py
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text #type:ignore
from sqlalchemy.orm import relationship #type:ignore
from datetime import datetime
from app.db.base import Base

class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.user_id"))
    document_id = Column(Integer, ForeignKey("documents.id"))
    started_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", backref="chat_sessions")
    document = relationship("Document", backref="chat_sessions")


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("chat_sessions.id"))
    role = Column(String, nullable=False)  # 'user' or 'assistant'
    content = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)

    session = relationship("ChatSession", backref="messages")
