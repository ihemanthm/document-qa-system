from sqlalchemy import Column, Integer,Boolean, String, ForeignKey, DateTime #type:ignore
from datetime import datetime
from app.db.base import Base  # type:ignore
class User(Base):
    __tablename__ = "users"

    user_id = Column(String, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=True)
    email_verified = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)