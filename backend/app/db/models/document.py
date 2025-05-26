from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey #type:ignore
from sqlalchemy.orm import relationship #type:ignore
from datetime import datetime
from app.db.base import Base #type:ignore

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    upload_time = Column(DateTime, default=datetime.utcnow)
    content = Column(Text, nullable=True)  # Raw extracted text (optional)
    source = Column(String, nullable=True)  # Path or S3 key (optional)
    user_id = Column(String, ForeignKey("users.user_id"))
    
    user = relationship("User", backref="documents")