# app/api/routes_users.py
from fastapi import APIRouter, HTTPException, Depends  # type: ignore
from pydantic import BaseModel # type: ignore
from sqlalchemy.orm import Session, joinedload # type: ignore
from app.db.session import SessionLocal
from app.db.models.users import User
from app.db.models.chat import ChatSession
from sqlalchemy.exc import IntegrityError # type: ignore

router = APIRouter()

class OAuthUserData(BaseModel):
    sub: str               # Google's unique user ID (google_id)
    email: str
    name: str = None
    email_verified: bool = False

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# @router.post("/", status_code=201)
# def create_user(user: OAuthUserData, db: Session = Depends(get_db)):
#     new_user = User(email=user.email, name=user.name)
#     try:
#         db.add(new_user)
#         db.commit()
#         db.refresh(new_user)
#         return new_user
#     except IntegrityError:
#         db.rollback()
#         raise HTTPException(status_code=400, detail="Email already exists")

@router.post("/auth/google")
def google_login(user_data: OAuthUserData, db: Session = Depends(get_db)):
    print(user_data)
    user = db.query(User).filter(User.user_id == user_data.sub).first()
    if not user:
        user = User(
            user_id=user_data.sub,
            email=user_data.email,
            name=user_data.name,
            email_verified=user_data.email_verified,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    # Fetch chat sessions + document metadata
    sessions = (
        db.query(ChatSession)
        .filter(ChatSession.user_id == user.user_id)
        .options(joinedload(ChatSession.document))  # Load document info
        .order_by(ChatSession.started_at.desc())
        .all()
    )
    
    # Format response
    session_data = [
        {
            "session_id": session.id,
            "created_at": session.started_at,
            "document": {
                "id": session.document.id,
                "filename": session.document.filename,
                "upload_time": session.document.upload_time,
                "file_url": session.document.source
            }
        }
        for session in sessions if session.document
    ]
    
    return {
        "user_id": user.user_id,
        "email": user.email,
        "name": user.name,
        "sessions": session_data
    }
    
    
@router.get("/{user_id}")
def get_user(user_id: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
