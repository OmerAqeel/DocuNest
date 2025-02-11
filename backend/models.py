from pydantic import BaseModel, EmailStr
from typing import List


# Model for Sign-Up requests
class User(BaseModel):
    user_id: str
    name: str
    email: EmailStr
    password: str

# Model for Sign-In requests
class SignInRequest(BaseModel):
    email: EmailStr
    password: str


# Model for Assistant requests (Create, Update, Delete)
class DeleteAssistantRequest(BaseModel):
    assistant_id: str

class DeleteWorkspaceAssistantRequest(BaseModel):
    assistant_id: str
    workspaceName: str

class ConversationRequest(BaseModel):
    user_id: str
    conversation_id: str
    assistant_id: str
    messages: List[dict]

class WorkspaceCreateRequest(BaseModel):
    workspace: dict
    users: List[str]
    owner: str