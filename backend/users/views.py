from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError,APIException
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.permissions import AllowAny
from rest_framework.authentication import get_authorization_header


from .serializers import SumInputSerializer
import jwt
import psycopg2
from datetime import datetime,timedelta,timezone

import re

DB_HOST = '192.168.1.64'
DB_NAME = 'auth_service'
DB_USER = 'postgres'
DB_PASSWORD = 'postgres'

SECRET_KEY = "testkey"
JWT_EXPIRATION = timedelta(days=1)

# Password validation settings
MIN_PASSWORD_LENGTH = 6
PASSWORD_REGEX = re.compile(r'^(?=.*[A-Za-z])(?=.*\d).+$')  # At least one letter and one number

def createToken(userid,username,timeInDays):
    
    payload = {
        "user_id":userid,
        "user_name":username,
        "expiration":str(datetime.now(tz=timezone.utc)+timedelta(days=timeInDays))
        }
    
    token = jwt.encode(payload,SECRET_KEY,algorithm="HS256")
    return token


def extractToken(token):
    payload = jwt.decode(token,SECRET_KEY,algorithms=['HS256'])
    return payload

def validate_password(password):
    
    if len(password) < MIN_PASSWORD_LENGTH:
        raise ValidationError(f"Password must be at least {MIN_PASSWORD_LENGTH} characters long")
    
    if not PASSWORD_REGEX.match(password):
        raise ValidationError("Password must contain at least one letter and one number")
    
    return True

def get_db_connection():
    try:
        connection = psycopg2.connect(
            host=DB_HOST,
            database=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD
        )
        return connection
    except psycopg2.Error as e:
        print(f"Database conection error: {e}")
        raise APIException(f"Database conection error: {e}")
    
class UserRegister(APIView):
    def post(self,request):
        conn = get_db_connection()
        cur = conn.cursor()
        conn.autocommit = False
        
        #---data validation---
        if not request.data.get('user_name'):
            raise ValidationError("Missing 'user_name' field.")
        if not request.data.get('user_pass'):
            raise ValidationError("Missing 'user_pass' field.")
        else:
            validate_password(request.data.get('user_pass'))
            
        user_name = request.data.get('user_name').lower()
        user_pass = request.data.get('user_pass').lower()
        
        #---credentials validation---
        cur.execute("""select usr_id from usr_info where usr_login = %s""",(user_name,))
        if cur.fetchone():
            raise ValidationError(f"Username {user_name} already in use.")
        
        #---user creation---
        cur.execute("""insert into usr_info (usr_login,usr_password,usr_access,usr_admin,created_at) values (%s,%s,%s,%s,%s)""",(user_name,user_pass,"0",False,datetime.now(tz=timezone.utc),))
        
        conn.commit()
        return Response({'response':f"User: {user_name} has been successfully registered"})

class UserLogin(APIView):
    
    permission_classes = [AllowAny]
    def post(self, request):
        conn = get_db_connection()
        
        cur = conn.cursor()
        if not request.data.get('user_name'):
            raise ValidationError("Missing 'user_name' field.")
        if not request.data.get('user_pass'):
            raise ValidationError("Missing 'user_pass' field.")
        else:
            validate_password(request.data.get('user_pass').lower())
            
        user_name = request.data.get('user_name').lower()
        user_pass = request.data.get('user_pass').lower()
            
        #---credentials validation---
        cur.execute("""select usr_id from usr_info where usr_login = %s and usr_password = %s""",(user_name,user_pass,))
        user = cur.fetchone()
        print(user[0])
        if not user:
            raise ValidationError(f"User not found or invalid credentials.")
        
        access_token = createToken(user[0],user_name,1)  
        refresh_token = createToken(user[0],user_name,90)
        return Response({"response":f"Login successful",'user': {'id': user[0], 'username': user_name},"access_token":f"{access_token}","refresh_token":f"{refresh_token}"})

        
class ValidateToken(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        auth_header = get_authorization_header(request).decode("utf-8")
        if not auth_header or not auth_header.startswith("Bearer "):
            raise ValidationError("No token provided")

        token = auth_header.split(" ")[1]

        try:
            payload = extractToken(token)
            # Optional: check if token is expired
            expiration = datetime.fromisoformat(payload.get("expiration"))
            if expiration < datetime.now(tz=timezone.utc):
                raise ValidationError("Token expired")

            return Response({"valid": True, "user_id": payload["user_id"], "user_name": payload["user_name"]})

        except jwt.ExpiredSignatureError:
            raise ValidationError("Token expired")
        except jwt.InvalidTokenError:
            raise ValidationError("Invalid token")
        except Exception as e:
            raise APIException(f"Token validation failed: {str(e)}")