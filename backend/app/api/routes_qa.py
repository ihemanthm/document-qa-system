#app/api/routes_qa.py
from fastapi import APIRouter, HTTPException, Depends  # type: ignore
from pydantic import BaseModel  # type: ignore
from sqlalchemy.orm import Session  # type: ignore
from app.db.session import SessionLocal
from app.db.models.chat import ChatSession, ChatMessage  # updated models
from app.services.qa_engine import query_pdf
from datetime import datetime

router = APIRouter()

class QuestionRequest(BaseModel):
    session_id: str
    question: str

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
        
@router.post("/")
async def ask_question(request: QuestionRequest, db:Session = Depends(get_db)):
    """
    Accepts a session_id and question, queries the vector index for the session's document,
    saves both user and assistant messages to the DB, and returns the answer.
    """
    # Validate session
    session = db.query(ChatSession).filter(ChatSession.id == request.session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Chat session not found")
    
    # Run QA on associated document
    document = session.document
    if not document:
        raise HTTPException(status_code=404, detail="Associated document not found")
    
    # Retrieve chat history messages
    messages = db.query(ChatMessage).filter(ChatMessage.session_id == session.id).order_by(ChatMessage.timestamp).all()
    history = "\n".join(f"{msg.role}: {msg.content}" for msg in messages)
    
    # Compose prompt with history + new question
    prompt = history + "\nuser: " + request.question + "\nassistant:"
    
    try:
        answer = query_pdf(doc_id=document.filename, question=prompt)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Query failed: {str(e)}")
    
    now = datetime.utcnow()

    db.add_all([
        ChatMessage(session_id=session.id, role="user", content=request.question, timestamp=now),
        ChatMessage(session_id=session.id, role="assistant", content=answer, timestamp=now)
    ])
    db.commit()

    return {"answer": answer}

