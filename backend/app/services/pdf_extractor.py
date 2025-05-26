#app/services/pdf_extractor.py
import fitz # type: ignore
import requests #type:ignore

def extract_text(path):
    doc = fitz.open(str(path))
    text = "\n".join([page.get_text() for page in doc])
    return text
