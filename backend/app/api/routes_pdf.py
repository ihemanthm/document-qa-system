# app/api/routes_pdf.py
from fastapi import APIRouter, HTTPException, Depends, Response  # type: ignore
from sqlalchemy.orm import Session  # type: ignore
from typing import Dict, Any

from app.db.session import SessionLocal
from app.db.models.chat import ChatSession, ChatMessage
from app.services.pdf_generator import generate_conversation_pdf

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/conversation/{session_id}")
async def download_conversation_pdf(
    session_id: int,
    db: Session = Depends(get_db)
) -> Response:
    """
    Generate and download a PDF of the conversation history.
    
    Args:
        session_id: The chat session ID
        db: Database session
        
    Returns:
        PDF file as response
        
    Raises:
        HTTPException: If session not found or PDF generation fails
    """
    try:
        # Validate session exists
        session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
        if not session:
            raise HTTPException(status_code=404, detail="Chat session not found")
        
        # Get associated document
        document = session.document
        if not document:
            raise HTTPException(status_code=404, detail="Associated document not found")
        
        # Get all messages for the session
        messages = (
            db.query(ChatMessage)
            .filter(ChatMessage.session_id == session_id)
            .order_by(ChatMessage.timestamp)
            .all()
        )
        
        # Prepare data for PDF generation
        session_data = {
            'session_id': session.id,
            'created_at': session.started_at.isoformat(),
        }
        
        message_data = [
            {
                'role': msg.role,
                'content': msg.content,
                'timestamp': msg.timestamp.isoformat()
            }
            for msg in messages
        ]
        
        document_data = {
            'filename': document.filename,
            'upload_time': document.upload_time.isoformat(),
            'file_url': document.source
        }
        
        # Generate PDF
        pdf_content = generate_conversation_pdf(
            session_data=session_data,
            messages=message_data,
            document_info=document_data
        )
        
        # Create filename
        filename = f"conversation_{session_id}_{document.filename}.pdf"
        
        # Return PDF as response
        return Response(
            content=pdf_content,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename={filename}",
                "Content-Type": "application/pdf"
            }
        )
        
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        # Handle unexpected errors
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate PDF: {str(e)}"
        )
