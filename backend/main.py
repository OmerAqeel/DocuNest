from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from fastapi import Depends
from typing import List
from file_processing import FileProcessor
from relevance_scoring import RelevanceScorer
import boto3
from boto3.dynamodb.conditions import Key, Attr
import os
from io import BytesIO
import tempfile
import json
import numpy as np
from starlette.responses import StreamingResponse
from passlib.context import CryptContext
from datetime import datetime, timedelta
from jwtAuthentication import create_access_token, get_secret_key
from jose import jwt, JWTError
from models import User, SignInRequest, DeleteAssistantRequest, ConversationRequest
from openai import OpenAI
import mimetypes
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

app = FastAPI()

with open("config.json", "r") as f:
    config = json.load(f)

client = OpenAI(
api_key=config["api-key"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="signin")

# Allowing requests from your frontend (localhost:5173)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
)

# Initialize S3 client
s3_client = boto3.client(
    's3',
    aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
    aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
    region_name='eu-north-1',  # Replace with your bucket's region
    config=boto3.session.Config(signature_version='s3v4')
)
BUCKET_NAME = "docunest-db"

# Initialize dynamodb client
dynamodb = boto3.resource('dynamodb',
                            aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
                            aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),  
                            region_name='eu-north-1'
                        )

# Initialize the table
usersTable = dynamodb.Table('Users')

# Initialize the workspace table
workspaceTable = dynamodb.Table('docunest_workspaces')

# Initialize the conversations table
conversationsTable = dynamodb.Table('conversations')

# Initialize password context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Initialize the relevance scorer
scorer = RelevanceScorer()

@app.post("/signin/")
async def signin(request: SignInRequest):
    email = request.email
    password = request.password

    response = usersTable.get_item(Key={"email": email})
    user = response.get("Item")
    if not user or not pwd_context.verify(password, user["Password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Include email in the token payload
    access_token = create_access_token(
        data={"sub": user["user_id"], "email": user["email"]}, 
        expires_delta=timedelta(hours=1)
    )
    return {"access_token": access_token, "token_type": "bearer"}



@app.post("/signup/")
async def signup(user: User):
    hashed_password = pwd_context.hash(user.password)
    try:
        usersTable.put_item(
            Item={
                "user_id": user.user_id,
                "Name": user.name,
                "email": user.email,
                "Password": hashed_password,
                "assistants" : [],
                "created_at": datetime.now().isoformat(),
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save user: {e}")

    return {"message": "User saved successfully"}




@app.get("/userdata")
async def get_user_data(token: str = Depends(oauth2_scheme)):
    secret_key = get_secret_key()
    try:
        payload = jwt.decode(token, secret_key, algorithms=["HS256"])
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    email = payload.get("email")
    if not email:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    # Fetch user data from DynamoDB using email
    response = usersTable.get_item(Key={"email": email})
    user_data = response.get("Item")
    if not user_data:
        raise HTTPException(status_code=404, detail="User not found")
    
    return user_data



@app.post("/create-assistant")
async def create_assistant(assistant: dict, token: str = Depends(oauth2_scheme)):
    secret_key = get_secret_key()
    try:
        payload = jwt.decode(token, secret_key, algorithms=["HS256"])
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    email = payload.get("email")
    if not email:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    # Fetch user data from DynamoDB
    response = usersTable.get_item(Key={"email": email})
    user_data = response.get("Item")
    if not user_data:
        raise HTTPException(status_code=404, detail="User not found")

    # Add the new assistant
    if "assistants" not in user_data:
        user_data["assistants"] = []
    user_data["assistants"].append(assistant)

    # Update DynamoDB with the new assistant
    usersTable.put_item(Item=user_data)

    return user_data

@app.post("/create-workspace")
async def create_workspace(
    workspace: dict,
    users: List[str]
):
    workspace_id = workspace.get("id")
    workspace_name = workspace.get("name")
    workspace_headerColor = workspace.get("headerColor")
    
    if not workspace_id or not workspace_name:
        raise HTTPException(status_code=400, detail="Workspace ID and name are required.")

    try:
        # Save workspace details in DynamoDB
        workspaceTable.put_item(
            Item={
                "workspace_id": workspace_id,
                "name": workspace_name,
                "users": users,
                "created_at": datetime.now().isoformat(),
                "headerColor": workspace_headerColor,
            }
        )
        
        # Notify each user
        for email in users:
            response = usersTable.get_item(Key={"email": email})
            user_data = response.get("Item")
            if not user_data:
                continue  # Skip if the user doesn't exist

            # Update notifications field
            if "notifications" not in user_data:
                user_data["notifications"] = []
            user_data["notifications"].append(f"You have been added to {workspace_name}")

            if "workspaces" not in user_data:
                user_data["workspaces"] = []
            user_data["workspaces"].append(workspace_name)

            # Update the user entry in DynamoDB
            usersTable.put_item(Item=user_data)

        return {"message": f"Workspace '{workspace_name}' created successfully and users notified."}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating workspace: {e}")



@app.delete("/delete-assistant/")
async def delete_assistant(
    request: DeleteAssistantRequest, 
    token: str = Depends(oauth2_scheme)
):
    # Decode the token and verify the user
    secret_key = get_secret_key()
    try:
        payload = jwt.decode(token, secret_key, algorithms=["HS256"])
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    email = payload.get("email")
    if not email:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    # Extract assistant_id from the body
    assistant_id = request.assistant_id

    # Fetch user data
    response = usersTable.get_item(Key={"email": email})
    user_data = response.get("Item")
    if not user_data:
        raise HTTPException(status_code=404, detail="User not found")

    # Remove the assistant
    assistants = user_data.get("assistants", [])
    user_data["assistants"] = [a for a in assistants if a["id"] != assistant_id]

    # Update DynamoDB
    usersTable.put_item(Item=user_data)

    # Delete S3 folder associated with the assistant
    folder_prefix = f"{user_data['user_id']}/{assistant_id}/"
    s3_objects = s3_client.list_objects_v2(Bucket=BUCKET_NAME, Prefix=folder_prefix).get("Contents", [])
    if s3_objects:
        s3_client.delete_objects(
            Bucket=BUCKET_NAME,
            Delete={"Objects": [{"Key": obj["Key"]} for obj in s3_objects]}
        )

    return {"message": "Assistant deleted successfully", "assistants": user_data["assistants"]}


@app.get("/get-workspaces")
async def get_workspaces(email: str):
    try:
        # Use #users as a placeholder for the reserved keyword
        response = workspaceTable.scan(
            FilterExpression="contains(#users, :email)",
            ExpressionAttributeNames={
                '#users': 'users'  # Map the placeholder to the actual attribute name
            },
            ExpressionAttributeValues={
                ':email': email  # Map the placeholder to the actual email value
            }
        )
        workspaces = response.get('Items', [])
        return {"workspaces": workspaces}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching workspaces: {e}")



@app.get("/get-all-users")
async def get_all_users():
    try:
        # Scan the Users table to get all users
        response = usersTable.scan(
            ProjectionExpression="email, #n",
            ExpressionAttributeNames={
                '#n': 'Name'  # 'Name' is a reserved word in DynamoDB
            }
        )
        
        users = response.get('Items', [])
        
        # Format the response to include just email and name
        formatted_users = [
            {
                "email": user["email"],
                "name": user["Name"]
            }
            for user in users
        ]
        
        return formatted_users
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch users: {str(e)}")
    

@app.get("/notifications")
async def get_notifications(token: str = Depends(oauth2_scheme)):
    """
    Fetch notifications for the user based on their email.
    """
    # Decode the token to get user email
    secret_key = get_secret_key()
    try:
        payload = jwt.decode(token, secret_key, algorithms=["HS256"])
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    email = payload.get("email")
    if not email:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    # Fetch user data from DynamoDB using email
    response = usersTable.get_item(Key={"email": email})
    user_data = response.get("Item")
    if not user_data:
        raise HTTPException(status_code=404, detail="User not found")

    # Retrieve notifications
    notifications = user_data.get("notifications", [])

    return {"notifications": notifications}



@app.post("/upload/")
async def upload_files(
    assistant_id: str = Form(...),
    assistant_name: str = Form(...),
    user_id: str = Form(...),
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

        # Step 6: Upload the file and JSON data to S3
        # Folder structure: {user_id}/{assistant_name}/{file_name}
        folder_path = f"{user_id}/{assistant_id}"
        file_key = f"{folder_path}/{file.filename}"
        json_key = f"{folder_path}/{file.filename}.json"

        # Determine MIME type dynamically
        content_type, _ = mimetypes.guess_type(file.filename)
        if not content_type:
            content_type = "application/octet-stream"  # Default fallback

        # Upload the file with appropriate content type
        s3_client.upload_file(
            temp_path,
            BUCKET_NAME,
            file_key,
            ExtraArgs={
                "ContentDisposition": "inline",
                "ContentType": content_type
            }
        )

        # Upload the JSON metadata
        json_bytes = BytesIO(json.dumps(json_data).encode("utf-8"))
        s3_client.upload_fileobj(json_bytes, BUCKET_NAME, json_key)

        # Remove the temporary file after processing
        os.remove(temp_path)

    return {"message": f"{len(files)} files processed and uploaded for Assistant-{assistant_id}"}



@app.get("/get-file/{file_name}")
async def get_file(file_name: str, assistant_id: str, user_id: str):
    try:
        file_key = f"{user_id}/{assistant_id}/{file_name}"
        response = s3_client.get_object(Bucket=BUCKET_NAME, Key=file_key)
        file_content = response['Body'].read()
        content_type = response['ContentType']

        # Generate presigned URL for direct S3 access
        url = s3_client.generate_presigned_url(
            'get_object',
            Params={
                'Bucket': BUCKET_NAME,
                'Key': file_key
            },
            ExpiresIn=3600  # URL expires in 1 hour
        )
        
        return {
            "url": url,
            "content_type": content_type,
            "filename": file_name
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching file: {e}")
    

@app.post("/save-conversation")
async def save_conversation(request: ConversationRequest):

    if(request.messages != None or len(request.messages) != 0):
        try:
            conversation_title = ""

            completion = client.chat.completions.create(
            model="gpt-4o",
            max_tokens=120,
            messages=
            [
            {"role": "system", "content": "You are an expert assistant designed to provide clear, concise, and well-structured responses to queries. Your responses must be accurate, specific, and directly address the query without unnecessary explanations or comments."},
            {"role": "user", "content": f"I need you to generate a 3-5 words of title for the conversation. Here are the messages: {request.messages}, make sure your response only containes 3-4 words and that is the title nothing else, you don't need to include any other information or explain anything. Just provide the title."}  
            ]
            )

            conversation_title = completion.choices[0].message.content
            
            # Save the conversation in DynamoDB
            conversationsTable.put_item(
                Item={
                    "conversationID": request.conversation_id,
                    "title": conversation_title,
                    "assistant_id": request.assistant_id,
                    "user_id": request.user_id,
                    "messages": request.messages,
                    "timestamp": datetime.now().isoformat()
                }
            )
            return {"message": "Conversation saved successfully"}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error saving conversation: {e}")
    else:
        raise HTTPException(status_code=400, detail="Messages are required to save a conversation.")
    

@app.get("/get-conversations")
async def get_conversations(user_id: str, assistant_id: str):
    try:
        response = conversationsTable.scan(
            FilterExpression=Attr("user_id").eq(user_id) & Attr("assistant_id").eq(assistant_id)
        )
        conversations = response.get("Items", [])
        return {"conversations": conversations}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching conversations: {e}")




@app.get("/ask/")
async def test_relevancy(
    user_id: str,
    assistant_id: str,
    query: str
):
    # Step 1: List all JSON files in the folder
    folder_prefix = f"{user_id}/{assistant_id}/"
    try:
        # Get the list of files in the specified folder
        response = s3_client.list_objects_v2(Bucket=BUCKET_NAME, Prefix=folder_prefix)
        if 'Contents' not in response:
            raise HTTPException(status_code=404, detail="No files found in S3.")

        # Filter only JSON files
        json_files = [obj['Key'] for obj in response['Contents'] if obj['Key'].endswith('.json')]
        if not json_files:
            raise HTTPException(status_code=404, detail="No JSON files found in S3 folder.")

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch files: {str(e)}")

    # Step 2: Combine chunks, embeddings, and filenames
    all_chunks = []
    all_embeddings = []
    chunk_file_map = []  # Map chunks to filenames

    try:
        for file_key in json_files:
            # Extract file name from S3 key
            filename = file_key.split("/")[-1]  # Extract file name

            # Load JSON content from S3
            json_obj = s3_client.get_object(Bucket=BUCKET_NAME, Key=file_key)
            json_data = json.loads(json_obj['Body'].read().decode('utf-8'))

            # Extract chunks and embeddings
            chunks = [item['text'] for item in json_data["Content"]]
            embeddings = np.array([item['embedding'] for item in json_data["Content"]])

            # Flatten embeddings if required
            if embeddings.ndim == 3:
                embeddings = embeddings.squeeze(axis=1)

            # Append to combined lists
            all_chunks.extend(chunks)
            all_embeddings.append(embeddings)

            # Map each chunk to its source file
            chunk_file_map.extend([filename] * len(chunks))

        # Concatenate all embeddings into one array
        all_embeddings = np.vstack(all_embeddings)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process files: {str(e)}")

    # Step 3: Generate embedding for the query
    query_embedding = scorer.generate_embeddings([query])[0]

    # Step 4: Calculate relevancy using combined data
    top_chunks = scorer.get_most_relevant_chunk(query, all_chunks, all_embeddings, top_n=10)

    # Step 5: Return relevant chunks along with filenames
    results = []
    for chunk, score in top_chunks:
        # Find the index of the chunk to get the corresponding filename
        index = all_chunks.index(chunk)
        results.append({
            "text": chunk,
            "score": score,
            "filename": chunk_file_map[index]
              # Get the filename for this chunk
        })

    completion = client.chat.completions.create(
        model="gpt-4o",
        max_tokens=300,
        messages=[
           {"role": "system", "content": "You are an expert assistant designed to provide clear, concise, and well-structured responses to queries. Your responses must be accurate, specific, and directly address the query without unnecessary explanations or comments."},
           {"role": "user", "content": f"I need you to generate a precise and structured response to the following query: '{query}'. \n\nYou have access to:\n1. **Top Relevant Chunks**: {results}\n\nYour task is to:\n\n- Avoid assumptions or speculative answers. Use only the provided data.\n- Format the output in a **structured and organised manner**.\n\n**Important Notes:**\n- Do **not** include extra comments, explanations and just be stright to the points rather than being verbose\n- Ensure the response is **factually accurate** and **specific** to the query.\n\nNow, generate the response for the given query."}  
        ]
    )
    

    return {
        # "query": query,
        # "top_chunks": results,
        "file": results[0]["filename"].split(".json")[0],
        "response": completion.choices[0].message.content,
        "highlight": results[0]["text"]
    }
