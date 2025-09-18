# app/api/routes_qa.py
from fastapi import APIRouter, HTTPException, Depends  # type: ignore
from pydantic import BaseModel  # type: ignore
from sqlalchemy.orm import Session  # type: ignore
from datetime import datetime
from typing import List, Dict, Any

from app.db.session import SessionLocal
from app.db.models.chat import ChatSession, ChatMessage
from app.services.qa_engine import query_pdf

router = APIRouter()

class QuestionRequest(BaseModel):
    session_id: int
    question: str

class ChatMessageResponse(BaseModel):
    id: int
    session_id: int
    role: str
    content: str
    timestamp: datetime

    class Config:
        orm_mode = True

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
        
@router.post("/")
async def ask_question(
    request: QuestionRequest, 
    db: Session = Depends(get_db)
) -> Dict[str, str]:
    """
    Accepts a session_id and question, queries the vector index for the session's document,
    saves both user and assistant messages to the DB, and returns the answer.
    
    Args:
        request: Question request containing session_id and question
        db: Database session
        
    Returns:
        Dict containing the AI assistant's answer
        
    Raises:
        HTTPException: If session not found, document not found, or query fails
    """
    try:
        # Validate session exists
        session = db.query(ChatSession).filter(ChatSession.id == request.session_id).first()
        if not session:
            raise HTTPException(status_code=404, detail="Chat session not found")
        
        # Validate associated document exists
        document = session.document
        if not document:
            raise HTTPException(status_code=404, detail="Associated document not found")
        
        # Retrieve chat history for context
        messages = (
            db.query(ChatMessage)
            .filter(ChatMessage.session_id == session.id)
            .order_by(ChatMessage.timestamp)
            .all()
        )
        
        # Build conversation history
        history = "\n".join(f"{msg.role}: {msg.content}" for msg in messages)
        
        # Compose enhanced prompt with context and guidelines
        system_prompt = (
            "You are a helpful document assistant. Answer questions based strictly on the document content. "
            "If a question is outside the document scope, politely respond: "
            "'I can only assist with questions related to the document content.'"
        )
        
        full_prompt = f"{system_prompt}\n\nConversation history:\n{history}\n\nUser: {request.question}\nAssistant:"
        
        # Query the document using the vector index
        answer = query_pdf(doc_id=document.filename, question=full_prompt)
        
        if not answer or not answer.strip():
            raise HTTPException(status_code=500, detail="Failed to generate response")
        
        # Save both user question and assistant response
        now = datetime.utcnow()
        new_messages = [
            ChatMessage(
                session_id=session.id, 
                role="user", 
                content=request.question, 
                timestamp=now
            ),
            ChatMessage(
                session_id=session.id, 
                role="assistant", 
                content=answer, 
                timestamp=now
            )
        ]
        
        db.add_all(new_messages)
        db.commit()
        
        return {"answer": answer}
        
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        # Handle unexpected errors
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to process question: {str(e)}"
        )

@router.get("/conversations/{session_id}", response_model=List[ChatMessageResponse])
async def get_conversation(
    session_id: int, 
    db: Session = Depends(get_db)
) -> List[ChatMessageResponse]:
    """
    Retrieve all messages for a specific chat session, ordered by timestamp.
    
    Args:
        session_id: The chat session ID
        db: Database session
        
    Returns:
        List of chat messages for the session
        
    Raises:
        HTTPException: If session not found
    """
    try:
        # Validate session exists
        session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
        if not session:
            raise HTTPException(status_code=404, detail="Chat session not found")
        
        # Get messages ordered by timestamp
        messages = (
            db.query(ChatMessage)
            .filter(ChatMessage.session_id == session_id)
            .order_by(ChatMessage.timestamp)
            .all()
        )
        
        return messages
        
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        # Handle unexpected errors
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve conversation: {str(e)}"
        )
