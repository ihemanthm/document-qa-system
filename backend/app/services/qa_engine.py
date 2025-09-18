#app/services/pdf_extractor.py
import os
from typing import Dict
from dotenv import load_dotenv #type:ignore
import faiss #type:ignore

from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings #type: ignore
from langchain_community.vectorstores import FAISS #type: ignore
from langchain.text_splitter import CharacterTextSplitter #type:ignore
from langchain.docstore.document import Document #type:ignore
from langchain.chains import RetrievalQA #type: ignore

load_dotenv()
gemini_api_key = os.getenv("GEMINI_API_KEY")
if not gemini_api_key:
    raise ValueError("GEMINI_API_KEY not found in environment.")

LLM_MODEL = os.getenv("LLM_MODEL", "gemini-1.5-flash")
# Use the canonical Google model naming with the required prefix for embeddings
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "models/text-embedding-004")

# Normalize embedding model to ensure it uses the expected 'models/' prefix
if not EMBEDDING_MODEL.startswith("models/"):
    EMBEDDING_MODEL = f"models/{EMBEDDING_MODEL}"

llm = ChatGoogleGenerativeAI(
    model=LLM_MODEL,
    google_api_key=gemini_api_key,
    temperature=0.1
)

embedding = GoogleGenerativeAIEmbeddings(
    model=EMBEDDING_MODEL,
    google_api_key=gemini_api_key
)

doc_qa_map: Dict[str, RetrievalQA] = {}

INDEX_DIR = "indexes"
os.makedirs(INDEX_DIR, exist_ok=True)

def build_index_from_pdf(text: str, doc_id: str):
    # Split text into chunks
    text_splitter = CharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
    texts = text_splitter.split_text(text)
    docs = [Document(page_content=t) for t in texts]

    # Embed and store in FAISS
    vectorstore = FAISS.from_documents(docs, embedding)
    faiss.write_index(vectorstore.index, f"{INDEX_DIR}/{doc_id}.faiss")
    retriever = vectorstore.as_retriever()

    # QA chain
    qa_chain = RetrievalQA.from_chain_type(llm=llm, retriever=retriever)
    doc_qa_map[doc_id] = qa_chain
    
def load_index(doc_id: str):
    if doc_id in doc_qa_map:
        return doc_qa_map[doc_id]
    index_path = f"{INDEX_DIR}/{doc_id}.faiss"
    if os.path.exists(index_path):
        index = faiss.read_index(index_path)
        vectorstore = FAISS(index, embedding)
        retriever = vectorstore.as_retriever()
        qa_chain = RetrievalQA.from_chain_type(llm=llm, retriever=retriever)
        doc_qa_map[doc_id] = qa_chain
        return qa_chain
    return None

def query_pdf(doc_id: str, question: str) -> str:
    print("Currently indexed docs:", list(doc_qa_map.keys()))
    qa_chain = load_index(doc_id)
    if not qa_chain:
        return "Document not indexed yet."
    return qa_chain.run(question)
