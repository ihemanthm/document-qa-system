from fastapi import FastAPI  # type: ignore
from app.api import routes_upload, routes_qa, routes_docs, routes_users
from fastapi.middleware.cors import CORSMiddleware  # type: ignore
from dotenv import load_dotenv  # type: ignore

load_dotenv()

app = FastAPI()

# CORS config
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check route
@app.get("/")
def read_root():
    return {"message": "Document QA backend is running."}

# Include routes
app.include_router(routes_upload.router, prefix="/upload", tags=["Upload"])
app.include_router(routes_qa.router, prefix="/ask", tags=["QA"])
app.include_router(routes_docs.router, prefix="/docs", tags=["Documents"])
app.include_router(routes_users.router, prefix = "/users", tags=["Documents"])