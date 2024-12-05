from jose import jwt, JWTError
from datetime import datetime, timedelta
import json 

def get_secret_key():
    with open('jwtSecret.json') as f:
        secrets = json.load(f)
    return secrets['Secret-key']


ALGORITHM = "HS256"

def create_access_token(data: dict, expires_delta: timedelta):
    to_encode = data.copy()
    expire = datetime.now() + expires_delta  # Use UTC for consistency
    to_encode.update({"exp": expire})
    secret_key = get_secret_key()
    encoded_jwt = jwt.encode(to_encode, secret_key, algorithm=ALGORITHM)
    return encoded_jwt