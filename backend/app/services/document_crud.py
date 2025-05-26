from sqlalchemy.orm import Session #type:ignore
from app.db.models.document import Document

def create_document(db: Session, doc_data: dict):
    doc = Document(**doc_data)
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc

def get_document_by_id(db: Session, doc_id: int):
    return db.query(Document).filter(Document.id == doc_id).first()

def get_all_documents(db: Session):
    return db.query(Document).all()
