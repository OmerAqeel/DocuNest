from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
from file_processing import FileProcessor
from relevance_scoring import RelevanceScorer
import boto3
import os
from io import BytesIO
import tempfile
import json
import numpy as np

app = FastAPI()

# Allowing requests from your frontend (localhost:5173)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Update with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
)

# Initialize S3 client
s3_client = boto3.client(
    's3',
    aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
    aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY')
)
BUCKET_NAME = "docunest-db"

# Initialize dynamodb client
dynamodb = boto3.resource('dynamodb',
                            aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
                            aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),  
                            region_name='eu-north-1'
                        )

# Initialize the table
table = dynamodb.Table('Users')

# Pydantic model for user data
class User(BaseModel):
    user_id: str
    name: str
    email: str
    password: str

@app.post("/signup/")
async def signup(user: User):
    table = dynamodb.Table("Users")

    try:
        # Save user data to the DynamoDB table
        table.put_item(
            Item={
                "user_id": user.user_id,
                "Name": user.name,
                "email": user.email,
                "Password": user.password
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save user: {e}")

    return {"message": "User saved successfully"}

# Initialize the relevance scorer
scorer = RelevanceScorer()

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

        # Step 4: Generate embeddings for each chunk
        chunk_embeddings = scorer.generate_embeddings(chunks)

        # Step 5: Create JSON data with the chunks and embeddings
        json_data = {
            "FileName": file.filename,
            "AssistantID": assistant_id,
            "Content": [
                {
                    "chunk_id": i + 1,
                    "text": chunk,
                    "embedding": embedding.tolist()  # Convert numpy array to list for JSON serialization
                }
                for i, (chunk, embedding) in enumerate(zip(chunks, chunk_embeddings))
            ]
        }

        # Step 6: Upload the JSON data to S3
        json_bytes = BytesIO(json.dumps(json_data).encode("utf-8"))
        s3_key = f"Assistant-{assistant_id}/{file.filename}.json"
        s3_client.upload_fileobj(json_bytes, BUCKET_NAME, s3_key)
        
        # Remove the temporary file after processing
        os.remove(temp_path)
    
    return {"message": f"{len(files)} files processed and uploaded for Assistant-{assistant_id}"}

@app.get("/test_relevancy/")
async def test_relevancy(assistant_id: str, filename: str):
    # Hardcoded query for testing
    query = "Who is applying for JP Morgan Chase?"

    # Step 1: Download the JSON data from S3
    s3_key = f"Assistant-{assistant_id}/{filename}.json"
    try:
        json_obj = s3_client.get_object(Bucket=BUCKET_NAME, Key=s3_key)
        json_data = json.loads(json_obj['Body'].read().decode('utf-8'))
    except s3_client.exceptions.NoSuchKey:
        raise HTTPException(status_code=404, detail="File not found in S3.")

    # Step 2: Extract chunks and embeddings from JSON data
    chunks = [item['text'] for item in json_data["Content"]]
    chunk_embeddings = np.array([item['embedding'] for item in json_data["Content"]])

    # Step 3: Ensure chunk_embeddings is a 2D array
    if chunk_embeddings.ndim == 3: 
        chunk_embeddings = chunk_embeddings.squeeze(axis=1)

    # Step 4: Generate embedding for the hardcoded query
    query_embedding = scorer.generate_embeddings([query])[0]

    # Step 5: Calculate relevancy and get the top relevant chunks
    top_chunks = scorer.get_most_relevant_chunk(query, chunks, chunk_embeddings, top_n=10)

    # Step 6: Return the relevant chunks
    return {"query": query, "top_chunks": [{"text": chunk, "score": score} for chunk, score in top_chunks]}