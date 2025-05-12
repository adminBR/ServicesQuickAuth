from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response


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

def createToken(userid,username):
    payload = {
        "user_id":userid,
        "user_name":username,
        "expiration":str(datetime.now(tz=timezone.utc)+JWT_EXPIRATION)
        }
    
    token = jwt.encode(payload,SECRET_KEY,algorithm="HS256")
    return token

def extractToken(token):
    payload = jwt.decode(token,SECRET_KEY,algorithms=['HS256'])
    return payload

def validate_password(password):
    
    if len(password) < MIN_PASSWORD_LENGTH:
        raise ValueError(f"Password must be at least {MIN_PASSWORD_LENGTH} characters long")
    
    if not PASSWORD_REGEX.match(password):
        raise ValueError("Password must contain at least one letter and one number")
    
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
        return None
    
class UserRegister(APIView):
    def post(self,request):
        conn = get_db_connection()
        if not conn:
            return Response({'response':f"Database conection error."})
        
        cur = conn.cursor()
        conn.autocommit = False
        try:
            user_name = request.data.get('user_name').lower()
            user_pass = request.data.get('user_pass').lower()
            
            #---data validation---
            if not user_name:
                raise ValueError("Missing 'user_name' field.")
            if not user_pass:
                raise ValueError("Missing 'user_pass' field.")
            else:
                validate_password(user_pass)
                    
            #---credentials validation---
            cur.execute("""select usr_id from usr_info where usr_login = %s""",(user_name,))
            if cur.fetchone():
                raise ValueError(f"Username {user_name} already in use.")
            
            #---user creation---
            cur.execute("""insert into usr_info (usr_login,usr_password,usr_access,usr_admin,created_at) values (%s,%s,%s,%s,%s)""",(user_name,user_pass,"0",False,datetime.now(tz=timezone.utc),))
            
            conn.commit()
            return Response({'response':f"User: {user_name} has been successfully registered"})
        except Exception as e:
            print(e)
            conn.rollback()
            return Response({'response':f"An error occured during registration: {e}"})

class UserLogin(APIView):
    def post(self, request):
        conn = get_db_connection()
        if not conn:
            return Response({'response':f"Database conection error."})
        
        cur = conn.cursor()
        try:
            user_name = request.data.get('user_name').lower()
            user_pass = request.data.get('user_pass').lower()
            
            if not user_name:
                raise ValueError("Missing 'user_name' field.")
            if not user_pass:
                raise ValueError("Missing 'user_pass' field.")
            else:
                validate_password(user_pass)
                
            #---credentials validation---
            cur.execute("""select usr_id from usr_info where usr_login = %s and usr_password = %s""",(user_name,user_pass,))
            user = cur.fetchone()
            print(user[0])
            if not user:
                raise ValueError(f"User not found or invalid credentials.")
            
            token = createToken(user[0],user_name)  
            return Response({"response":f"Login successful",'user': {'id': user[0], 'username': user_name},"token":f"{token}"})
            
        
        except Exception as e:
            print(e)
            return Response({"response":f"Error in the login: {e}"})
        
