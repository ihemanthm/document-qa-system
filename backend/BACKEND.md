# Backend Service (FastAPI)

This document explains the backend folder structure, key modules, environment configuration, and how to set up and run the service.

## Folder Structure

```
backend/
├─ .env.sample                # Example environment variables
├─ .gitignore
├─ alembic/                   # Database migrations
│  └─ versions/               # Auto/hand-written migration scripts
├─ alembic.ini                # Alembic configuration
├─ app/
│  ├─ api/
│  │  ├─ routes_docs.py       # Document list/delete endpoints
│  │  ├─ routes_qa.py         # Ask questions + get conversation history
│  │  ├─ routes_upload.py     # Upload PDF & create vector index/session
│  │  └─ routes_users.py      # User-related endpoints
│  ├─ core/
│  │  └─ config.py            # Settings (env-based configuration)
│  ├─ db/
│  │  ├─ base.py              # SQLAlchemy base
│  │  ├─ models/
│  │  │  ├─ __init__.py
│  │  │  ├─ chat.py           # ChatSession & ChatMessage models
│  │  │  ├─ document.py       # Document model
│  │  │  └─ users.py          # User model
│  │  └─ session.py           # SessionLocal & engine
│  ├─ services/
│  │  ├─ document_crud.py     # Document CRUD helpers
│  │  ├─ pdf_extractor.py     # Text extraction from PDFs
│  │  ├─ qa_engine.py         # FAISS/LangChain querying & index building
│  │  └─ s3_client.py         # S3 upload helper
│  └─ main.py                 # FastAPI app, CORS, route includes
├─ indexes/                   # (Optional) Vector indexes cache
├─ uploaded_pdfs/             # Temp local upload cache (cleaned up)
├─ requirements.txt
└─ runtime.txt                # Runtime hint for some platforms
```

## Key Endpoints

- `POST /upload/` – Upload a PDF, extract text, index it, create chat session
- `POST /ask/` – Ask a question against a session’s document
- `GET /ask/conversations/{session_id}` – Retrieve chat history
- `GET /docs/` – List user documents
- `DELETE /docs/{doc_id}` – Delete a document
- `GET /` – Health check

## Environment Variables

Copy `.env.sample` to `.env` and fill in values:

```
DATABASE_URL=<postgresql://USER:PASSWORD@HOST:PORT/DB_NAME>

AWS_ACCESS_KEY_ID=<AWS_ACCESS_KEY_ID>
AWS_SECRET_ACCESS_KEY=<AWS_SECRET_ACCESS_KEY>
AWS_REGION=<AWS_REGION>
AWS_S3_BUCKET_NAME=<AWS_S3_BUCKET_NAME>

UPLOAD_DIR=uploaded_pdfs
```

Additional settings are read by `app/core/config.py` (Pydantic settings). Make sure your DB is reachable by SQLAlchemy.

## CORS

The backend is configured to allow the following origins in `app/main.py`:

- `http://localhost:3000`
- `http://127.0.0.1:3000`
- `https://document-qa-system-1.onrender.com` (production frontend)

Update this list if you deploy the frontend to additional domains.

## Setup

1) Create and activate a virtual environment (recommended)

```bash
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\\Scripts\\activate
```

2) Install dependencies

```bash
pip install -r requirements.txt
```

3) Configure environment

```bash
cp .env.sample .env
# edit .env with your credentials
```

4) Initialize database

```bash
alembic upgrade head
```

5) Run the server (dev)

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Visit API docs at:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Notes & Tips

- Make sure your AWS credentials have permission to upload to the configured S3 bucket.
- Temporary local uploads are written to `UPLOAD_DIR` then cleaned after processing.
- If you change models, create migrations with Alembic and upgrade.
- Errors are returned with helpful messages; check server logs for full details.
