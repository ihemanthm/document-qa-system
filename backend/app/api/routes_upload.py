# app/api/routes_upload.py
import os
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends  # type: ignore
from uuid import uuid4
from pathlib import Path
from sqlalchemy.orm import Session  # type: ignore
from app.core.config import settings
from app.services.pdf_extractor import extract_text
from app.services.qa_engine import build_index_from_pdf
from app.db.session import SessionLocal
from app.db.models.document import Document
from app.db.models.users import User
from app.db.models.chat import ChatSession
from app.services.s3_client import upload_pdf

router = APIRouter()
UPLOAD_DIR = Path(settings.upload_dir)
UPLOAD_DIR.mkdir(exist_ok=True)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
        

@router.post("/")
async def upload(file: UploadFile = File(...), user_id: str = Form(...), db: Session = Depends(get_db)):
    """
    Uploads a PDF, extracts text, builds vector index, and returns file ID.
    """
    file_id = str(uuid4())
    filename = f"{file_id}_{file.filename}"
    file_path = UPLOAD_DIR / filename

    # Save uploaded PDF
    with open(file_path, "wb") as f:
        content = await file.read()
        f.write(content)
        
    upload_result = await upload_pdf(file)
    s3_url = upload_result.get("url")
    if not s3_url:
        raise HTTPException(status_code=500, detail="Failed to upload file to S3")
    
    # Extract text (from in-memory bytes)
    with open("temp.pdf", "wb") as temp_file:
        temp_file.write(content)

    # Extract text and build vector index
    text = extract_text("temp.pdf")
    os.remove("temp.pdf")
    
    build_index_from_pdf(text=text, doc_id=file_id)
    
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User ID not found")

    # Store metadata
    doc = Document(
        filename=file_id,
        content=text,
        source=s3_url,
        user_id=user_id
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    
    session = ChatSession(user_id=user_id, document_id=doc.id)
    db.add(session)
    db.commit()
    db.refresh(session)
    
    return {
        "file_id": doc.id,
        "filename": doc.filename,
        "s3_url": s3_url,
        "text_excerpt": text[:500],
        "session_id": session.id
    }
