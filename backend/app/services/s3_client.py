import boto3 #type: ignore
from fastapi import APIRouter, File, UploadFile, HTTPException #type: ignore
from botocore.exceptions import BotoCoreError, ClientError #type: ignore
import os
import uuid
from dotenv import load_dotenv #type: ignore

load_dotenv()  # if using .env file

router = APIRouter()

s3_client = boto3.client(
    "s3",
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
    region_name=os.getenv("AWS_REGION")
)

BUCKET_NAME = os.getenv("AWS_S3_BUCKET_NAME")

@router.post("/upload_pdf")
async def upload_pdf(file: UploadFile = File(...)):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")

    unique_filename = f"{uuid.uuid4()}.pdf"

    try:
        contents = await file.read()
        s3_client.put_object(
            Bucket=BUCKET_NAME,
            Key=unique_filename,
            Body=contents,
            ContentType="application/pdf"
        )
    except (BotoCoreError, ClientError) as e:
        raise HTTPException(status_code=500, detail=f"Error uploading file: {str(e)}")

    file_url = f"https://{BUCKET_NAME}.s3.{os.getenv('AWS_REGION')}.amazonaws.com/{unique_filename}"
    return {"filename": unique_filename, "url": file_url}
