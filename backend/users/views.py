from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError,APIException
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.permissions import AllowAny
from rest_framework.authentication import get_authorization_header
from rest_framework import status
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator



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
    def post(self, request):
        conn = get_db_connection()
        cur = conn.cursor()
        conn.autocommit = False

        try:
            # --- data validation ---
            if not request.data.get('user_name'):
                raise ValidationError("Missing 'user_name' field.")
            if not request.data.get('user_pass'):
                raise ValidationError("Missing 'user_pass' field.")
            else:
                validate_password(request.data.get('user_pass'))

            user_name = request.data.get('user_name').lower()
            user_pass = request.data.get('user_pass').lower()

            # --- credentials validation ---
            cur.execute("""SELECT usr_id FROM usr_info WHERE usr_login = %s""", (user_name,))
            if cur.fetchone():
                raise ValidationError(f"Username {user_name} already in use.")

            # --- user creation ---
            cur.execute("""
                INSERT INTO usr_info (usr_login, usr_password, usr_access, usr_admin, created_at) 
                VALUES (%s, %s, %s, %s, %s)
            """, (user_name, user_pass, "0", False, datetime.now(tz=timezone.utc)))

            conn.commit()
            return Response({'response': f"User: {user_name} has been successfully registered"})
        finally:
            cur.close()
            conn.close()


@method_decorator(csrf_exempt, name='dispatch')
class UserLogin(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        conn = get_db_connection()
        cur = conn.cursor()

        try:
            if not request.data.get('user_name'):
                raise ValidationError("Missing 'user_name' field.")
            if not request.data.get('user_pass'):
                raise ValidationError("Missing 'user_pass' field.")
            else:
                validate_password(request.data.get('user_pass').lower())

            user_name = request.data.get('user_name').lower()
            user_pass = request.data.get('user_pass').lower()

            try:
                cur.execute("""
                    SELECT usr_id,usr_admin FROM usr_info 
                    WHERE usr_login = %s AND usr_password = %s
                """, (user_name, user_pass,))
                user = cur.fetchone()
            except psycopg2.Error:
                raise APIException('Database query error!')

            if not user:
                raise ValidationError("User not found or invalid credentials.")

            access_token = createToken(user[0], user_name, 1)
            refresh_token = createToken(user[0], user_name, 90)

            resp = Response({
                "response": "Login successful",
                "user": {"id": user[0], "username": user_name},
                "access_token": access_token,
                "refresh_token": refresh_token,
                "isAdmin":user[1]
            })
            resp.set_cookie(
                key="token",
                value=access_token,
                httponly=True,
                secure=False,
                samesite="Strict",
                path="/"
            )
            return resp
        finally:
            cur.close()
            conn.close()

    
class UserLogout(APIView):
    def get(self,request):
        response = Response({'message': 'Logged out'})
        response.delete_cookie('token')  # This must match the cookie name you set
        return response

        
class ValidateToken(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        auth = get_authorization_header(request).decode()
        service_id = request.headers.get("X-Service-ID")
        if not auth.startswith("Bearer "):
            return Response({"detail": "No token provided"}, 
                            status=status.HTTP_401_UNAUTHORIZED)

        token = auth.split()[1]
        try:
            payload = extractToken(token)
            expiration = datetime.fromisoformat(payload["expiration"])
            if expiration < datetime.now(timezone.utc):
                return Response({"detail":"Token expired"},
                                status=status.HTTP_401_UNAUTHORIZED)
                
            user_id = payload["user_id"]

            if service_id:
                # check DB access
                conn = get_db_connection()
                cur = conn.cursor()
                try:
                    cur.execute("SELECT usr_access FROM usr_info WHERE usr_id = %s", (user_id,))
                    result = cur.fetchone()
                    if not result:
                        return Response({"detail": "User not found"}, status=status.HTTP_401_UNAUTHORIZED)

                    allowed_services = result[0].split(",")
                    if service_id not in allowed_services:
                        return Response({"detail": "Access denied to this service"},
                                        status=status.HTTP_401_UNAUTHORIZED)
                finally:
                    cur.close()
                    conn.close()

            return Response({"user_id": payload["user_id"],
                             "user_name": payload["user_name"]},
                            status=status.HTTP_200_OK)
        except jwt.ExpiredSignatureError:
            return Response({"detail":"Token expired"},
                            status=status.HTTP_401_UNAUTHORIZED)
        except jwt.InvalidTokenError:
            return Response({"detail":"Invalid token"},
                            status=status.HTTP_401_UNAUTHORIZED)
        except Exception as e:
            return Response({"detail": str(e)},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            
class RefreshToken(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        refresh_token = request.data.get("refresh_token")
        if not refresh_token:
            return Response({"detail": "Refresh token is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            payload = extractToken(refresh_token)
            expiration = datetime.fromisoformat(payload["expiration"])
            if expiration < datetime.now(timezone.utc):
                return Response({"detail": "Refresh token expired"}, status=status.HTTP_401_UNAUTHORIZED)

            # Issue a new access token
            new_access_token = createToken(payload["user_id"], payload["user_name"], 1)

            return Response({
                "access_token": new_access_token
            }, status=status.HTTP_200_OK)

        except jwt.ExpiredSignatureError:
            return Response({"detail": "Token expired"}, status=status.HTTP_401_UNAUTHORIZED)
        except jwt.InvalidTokenError:
            return Response({"detail": "Invalid token"}, status=status.HTTP_401_UNAUTHORIZED)
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
