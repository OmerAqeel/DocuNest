from pydantic import BaseModel, EmailStr


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