from fastapi import FastAPI, File, UploadFile, Form
from typing import List
from file_processing import FileProcessor
import boto3
import os
from io import BytesIO
import tempfile
import json

app = FastAPI()

# Initialize S3 client
s3_client = boto3.client(
    's3',
    aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
    aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY')
)
BUCKET_NAME = "docunest-db"

@app.post("/upload/")
async def upload_files(
    assistant_id: str = Form(...),
    files: List[UploadFile] = File(...)
):
    for file in files:
        # Step 1: Save the file temporarily using tempfile
        with tempfile.NamedTemporaryFile(delete=False) as temp_file:
            temp_file.write(await file.read())  # Read file content asynchronously
            temp_path = temp_file.name  # Save the temporary file path

        # Initialize the FileProcessor for each file
        processor = FileProcessor(
            file_path=temp_path,
            file_name=file.filename,
            assistant_id=assistant_id,
            content_type=file.content_type
        )

        # Step 2: Parse the file content
        parsed_text = processor.parse_file()

        # Step 3: Chunk the parsed content
        chunks = processor.chunk_text(parsed_text)

        # Step 4: Create JSON data with the chunks
        json_data = processor.create_json_data(chunks)

        # Step 5: Upload the JSON data to S3
        json_bytes = BytesIO(json.dumps(json_data).encode("utf-8"))
        s3_key = f"Assistant-{assistant_id}/{file.filename}.json"
        s3_client.upload_fileobj(json_bytes, BUCKET_NAME, s3_key)
        
        # Remove the temporary file after processing
        os.remove(temp_path)
    
    return {"message": f"{len(files)} files processed and uploaded for Assistant-{assistant_id}"}
