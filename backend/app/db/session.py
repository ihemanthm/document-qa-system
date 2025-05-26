from sqlalchemy import create_engine #type:ignore
from sqlalchemy.orm import sessionmaker #type:ignore
from app.core.config import settings
import os

DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_engine(settings.database_url)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)