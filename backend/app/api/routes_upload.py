# app/api/routes_upload.py
import os
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends  # type: ignore
from uuid import uuid4
from pathlib import Path
from sqlalchemy.orm import Session  # type: ignore
from typing import Dict, Any

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
async def upload(
    file: UploadFile = File(...), 
    user_id: str = Form(...), 
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Uploads a PDF, extracts text, builds vector index, and returns session info.
    
    Args:
        file: The uploaded PDF file
        user_id: The user's unique identifier
        db: Database session
        
    Returns:
        Dict containing session_id, created_at, and document info
        
    Raises:
        HTTPException: If upload fails, user not found, or processing errors
    """
    # Validate file type
    if not file.filename or not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
    
    # Validate user exists
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    file_id = str(uuid4())
    filename = f"{file_id}_{file.filename}"
    file_path = UPLOAD_DIR / filename

    try:
        # Save uploaded PDF locally for processing
        content = await file.read()
        with open(file_path, "wb") as f:
            f.write(content)

        # Reset file pointer for S3 upload
        await file.seek(0)
        
        # Upload to S3
        upload_result = await upload_pdf(file)
        s3_url = upload_result.get("url")
        if not s3_url:
            raise HTTPException(status_code=500, detail="Failed to upload file to S3")
        
        # Extract text and build vector index
        text = extract_text(file_path)
        if not text.strip():
            raise HTTPException(status_code=400, detail="Could not extract text from PDF")
            
        build_index_from_pdf(text=text, doc_id=file_id)
        
        # Store document metadata
        doc = Document(
            filename=file_id,
            content=text,
            source=s3_url,
            user_id=user_id
        )
        db.add(doc)
        db.commit()
        db.refresh(doc)
        
        # Create chat session
        session = ChatSession(user_id=user_id, document_id=doc.id)
        db.add(session)
        db.commit()
        db.refresh(session)
        
        return {
            "session_id": session.id,
            "created_at": session.started_at,
            "document": {
                "id": doc.id,
                "filename": doc.filename,
                "upload_time": doc.upload_time,
                "file_url": doc.source
            }
        }
        
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        # Clean up local file on error
        if file_path.exists():
            os.remove(file_path)
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to process document: {str(e)}"
        )
    finally:
        # Clean up local file after processing
        if file_path.exists():
            os.remove(file_path)
    
