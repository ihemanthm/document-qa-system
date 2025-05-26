# app/core/config.py
import os
from pydantic_settings import BaseSettings # type: ignore
from dotenv import load_dotenv  # type: ignore

class Settings(BaseSettings):
    database_url: str
    upload_dir: str
    gemini_api_key: str

    class Config:
        env_file = ".env"
        extra = "allow"
        
settings = Settings()