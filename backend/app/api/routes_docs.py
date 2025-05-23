# app/api/routes_docs.py
from fastapi import APIRouter, Depends, HTTPException, Query #type: ignore
from sqlalchemy.orm import Session #type:ignore
from app.db.session import SessionLocal
from app.db.models.document import Document #type:ignore
from app.db.models.chat import ChatSession, ChatMessage

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/", status_code=200)
def get_user_documents(user_id:str =  Query(...), filename:str = Query(...), db: Session = Depends(get_db)):
    """
    Fetch a single document comparing filename and user_id.
    """
    document = db.query(Document).filter(Document.user_id == user_id, Document.filename == filename).first()
    if not document:
        raise HTTPException(status_code=404, detail="No documents found for this User ID and Filename")
    return document

@router.get("/user/{user_id}", status_code=200)
def get_user_documents(user_id: str, db: Session = Depends(get_db)):
    """
    Fetch all documents for a specific user.
    """
    documents = db.query(Document).filter(Document.user_id == user_id).all()
    if not documents:
        raise HTTPException(status_code=404, detail="No documents found for this user")
    return documents

@router.delete("/", status_code=204)
def remove_user_document(user_id:str = Query(...),filename = Query(...), db:Session = Depends(get_db)):
    """
        Remove a single document
    """
    document = db.query(Document).filter(Document.user_id == user_id, Document.filename == filename).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found for the given User ID and Filename")
    
     # Delete associated chat messages and sessions
    sessions = db.query(ChatSession).filter(ChatSession.document_id == document.id).all()
    for session in sessions:
        db.query(ChatMessage).filter(ChatMessage.session_id == session.id).delete()
        db.delete(session)
        
    db.delete(document)
    db.commit()
    return {"detail": "Document and associated chat sessions/messages deleted successfully"}


