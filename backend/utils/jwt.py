from rest_framework.exceptions import ValidationError,APIException
from rest_framework import status
from rest_framework.authentication import get_authorization_header

from utils import database

from datetime import datetime,timedelta,timezone
import jwt
import re


SECRET_KEY = "testkey"
JWT_EXPIRATION = timedelta(days=1)

def create_token(userid,username,timeInDays):
    payload = {
        "user_id":userid,
        "user_name":username,
        "expiration":str("inf" if timeInDays == "inf" else datetime.now(tz=timezone.utc)+timedelta(days=timeInDays))
        }
    
    token = jwt.encode(payload,SECRET_KEY,algorithm="HS256")
    return token

def decode_token(token):
    payload = jwt.decode(token,SECRET_KEY,algorithms=['HS256'])
    return payload



def get_admin_user_from_token(request):
    auth = get_authorization_header(request).decode()
    if not auth.startswith("Bearer "):
        # Try to get token from cookie if not in header (for potential browser direct access, though API usually uses Header)
        token_from_cookie = request.COOKIES.get('token') # Assuming 'token' is the cookie name used in UserLogin
        if not token_from_cookie:
            raise APIException("Authentication credentials were not provided.", code=status.HTTP_401_UNAUTHORIZED)
        token = token_from_cookie
    else:
        token = auth.split(" ")[1]

    try:
        payload = decode_token(token) # extractToken should handle expired/invalid internally if needed, or raise
        expiration_str = payload.get("expiration")
        if not expiration_str:
            raise APIException("Invalid token: Missing expiration.", code=status.HTTP_401_UNAUTHORIZED)
        
        expiration = datetime.fromisoformat(expiration_str)
        if expiration < datetime.now(timezone.utc):
            raise APIException("Token expired", code=status.HTTP_401_UNAUTHORIZED)

        user_id = payload.get("user_id")
        if not user_id:
            raise APIException("Invalid token: Missing user_id.", code=status.HTTP_401_UNAUTHORIZED)

        conn = database.get_db_connection()
        cur = conn.cursor()
        try:
            cur.execute("SELECT usr_admin, usr_login FROM usr_info WHERE usr_id = %s", (user_id,))
            user_record = cur.fetchone()
            if not user_record:
                raise APIException("User not found", code=status.HTTP_401_UNAUTHORIZED)
            
            is_admin = user_record[0]
            user_name = user_record[1]

            if not is_admin:
                raise APIException("Admin privileges required.", code=status.HTTP_403_FORBIDDEN)
            
            return {"user_id": user_id, "user_name": user_name, "is_admin": True}
        finally:
            cur.close()
            conn.close()
    except jwt.ExpiredSignatureError:
        raise APIException("Token expired", code=status.HTTP_401_UNAUTHORIZED)
    except jwt.InvalidTokenError:
        raise APIException("Invalid token", code=status.HTTP_401_UNAUTHORIZED)
    except APIException as e: # Re-raise APIExceptions with their status codes
        raise e
    except Exception as e:
        # It's good practice to log the actual error `e` here
        print(f"Admin Auth Error: {e}")
        raise APIException("An error occurred during token validation.", code=status.HTTP_500_INTERNAL_SERVER_ERROR)