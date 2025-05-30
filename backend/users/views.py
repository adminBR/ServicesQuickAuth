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

from datetime import datetime,timedelta,timezone
import jwt
import psycopg2
import re

from .serializers import SumInputSerializer
from utils.jwt import create_token,decode_token,get_admin_user_from_token
from utils.database import get_db_connection

PASSWORD_REGEX = re.compile(r'^(?=.*[A-Za-z])(?=.*\d).+$')  # At least one letter and one number
MIN_PASSWORD_LENGTH = 6

def validate_password(password):
    if len(password) < MIN_PASSWORD_LENGTH:
        raise ValidationError(f"Password must be at least {MIN_PASSWORD_LENGTH} characters long")
    
    if not PASSWORD_REGEX.match(password):
        raise ValidationError("Password must contain at least one letter and one number")
    
    return True


class UserRegister(APIView):
    def post(self, request):
        conn = get_db_connection()
        cur = conn.cursor()
        conn.autocommit = False

        try:
            if not request.data.get('user_name'):
                raise ValidationError("Missing 'user_name' field.")
            if not request.data.get('user_pass'):
                raise ValidationError("Missing 'user_pass' field.")
            else:
                validate_password(request.data.get('user_pass'))

            user_name = request.data.get('user_name')
            user_name = user_name.lower()
            user_pass = request.data.get('user_pass')

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
                validate_password(request.data.get('user_pass'))

            user_name = request.data.get('user_name')
            user_name = user_name.lower()
            user_pass = request.data.get('user_pass')

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

            access_token = create_token(user[0], user_name, 1)
            refresh_token = create_token(user[0], user_name, 90)

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
            payload = create_token(token)
            expiration = datetime.fromisoformat(payload["expiration"])
            if expiration < datetime.now(timezone.utc):
                return Response({"detail":"Token expired"},
                                status=status.HTTP_401_UNAUTHORIZED)
                
            user_id = payload["user_id"]

            if service_id:
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
            payload = decode_token(refresh_token)
            expiration = datetime.fromisoformat(payload["expiration"])
            if expiration < datetime.now(timezone.utc):
                return Response({"detail": "Refresh token expired"}, status=status.HTTP_401_UNAUTHORIZED)

            # Issue a new access token
            new_access_token = decode_token(payload["user_id"], payload["user_name"], 1)

            return Response({
                "access_token": new_access_token
            }, status=status.HTTP_200_OK)

        except jwt.ExpiredSignatureError:
            return Response({"detail": "Token expired"}, status=status.HTTP_401_UNAUTHORIZED)
        except jwt.InvalidTokenError:
            return Response({"detail": "Invalid token"}, status=status.HTTP_401_UNAUTHORIZED)
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@method_decorator(csrf_exempt, name='dispatch')
class AdminUserOperationsView(APIView):
    authentication_classes = [] # Custom token handling
    permission_classes = [AllowAny] # Custom permission check in method

    def get(self, request):
        try:
            get_admin_user_from_token(request) # Authenticate and authorize admin
        except APIException as e:
            return Response({"detail": e.detail}, status=e.status_code)

        conn = get_db_connection()
        cur = conn.cursor()
        try:
            cur.execute("SELECT usr_id, usr_login, usr_admin, usr_access, created_at FROM usr_info ORDER BY usr_id")
            users_data = cur.fetchall()
            users_list = [
                {
                    "id": row[0], 
                    "username": row[1], 
                    "is_admin": row[2], 
                    "access": row[3],
                    "created_at": row[4].isoformat() if row[4] else None
                } for row in users_data
            ]
            return Response(users_list, status=status.HTTP_200_OK)
        except psycopg2.Error as e:
            raise APIException(f"Database query error: {e}")
        finally:
            cur.close()
            conn.close()

    def post(self, request):
        try:
            get_admin_user_from_token(request) # Authenticate and authorize admin
        except APIException as e:
            return Response({"detail": e.detail}, status=e.status_code)

        data = request.data
        user_name = data.get('user_name')
        user_pass = data.get('user_pass')
        is_admin = data.get('is_admin', False) # Default to False if not provided
        usr_access = data.get('access', "")    # Default to empty string

        if not user_name:
            raise ValidationError("Missing 'user_name' field.")
        if not user_pass:
            raise ValidationError("Missing 'user_pass' field.")
        
        validate_password(user_pass)

        user_name = user_name.lower()
        # Note: use bcrypt in the future to not store plain text passwords
        user_pass_processed = user_pass

        conn = get_db_connection()
        cur = conn.cursor()
        conn.autocommit = False
        try:
            cur.execute("SELECT usr_id FROM usr_info WHERE usr_login = %s", (user_name,))
            if cur.fetchone():
                raise ValidationError(f"Username '{user_name}' already in use.")

            cur.execute("""
                INSERT INTO usr_info (usr_login, usr_password, usr_admin, usr_access, created_at)
                VALUES (%s, %s, %s, %s, %s) RETURNING usr_id
            """, (user_name, user_pass_processed, bool(is_admin), usr_access, datetime.now(tz=timezone.utc)))
            new_user_id = cur.fetchone()[0]
            conn.commit()
            return Response({
                "response": f"User '{user_name}' created successfully.",
                "user": {"id": new_user_id, "username": user_name, "is_admin": bool(is_admin), "access": usr_access}
            }, status=status.HTTP_201_CREATED)
        except psycopg2.Error as db_error:
            conn.rollback()
            # Check for unique constraint violation specifically if not caught by pre-check
            if "unique constraint" in str(db_error).lower() and "usr_login" in str(db_error).lower() :
                 raise ValidationError(f"Username '{user_name}' already in use.")
            raise APIException(f"Database error: {db_error}")
        except ValidationError as ve:
            conn.rollback()
            raise ve
        finally:
            cur.close()
            conn.close()


@method_decorator(csrf_exempt, name='dispatch')
class AdminUserDetailOperationsView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def get(self, request, target_user_id):
        try:
            get_admin_user_from_token(request)
        except APIException as e:
            return Response({"detail": e.detail}, status=e.status_code)

        conn = get_db_connection()
        cur = conn.cursor()
        try:
            cur.execute("SELECT usr_id, usr_login, usr_admin, usr_access, created_at FROM usr_info WHERE usr_id = %s", (target_user_id,))
            user_data = cur.fetchone()
            if not user_data:
                return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)
            
            user_details = {
                "id": user_data[0], 
                "username": user_data[1], 
                "is_admin": user_data[2], 
                "access": user_data[3],
                "created_at": user_data[4].isoformat() if user_data[4] else None
            }
            return Response(user_details, status=status.HTTP_200_OK)
        except psycopg2.Error as e:
            raise APIException(f"Database query error: {e}")
        finally:
            cur.close()
            conn.close()

    def put(self, request, target_user_id):
        try:
            admin_user = get_admin_user_from_token(request)
        except APIException as e:
            return Response({"detail": e.detail}, status=e.status_code)

        data = request.data
        user_pass = data.get('user_pass')
        is_admin = data.get('is_admin') # Expect boolean or it can be omitted
        usr_access = data.get('access') # Expect string or it can be omitted

        update_fields = []
        update_values = []

        if user_pass is not None:
            if user_pass == "": # Allow clearing password if business logic permits (unlikely for required field)
                # Here assuming password is required, so empty string is invalid if not for specific purpose
                 raise ValidationError("Password cannot be empty if provided for update.")
            validate_password(user_pass)
            # Again, HASH THE PASSWORD in a real application
            update_fields.append("usr_password = %s")
            update_values.append(user_pass) # Processed/hashed password

        if is_admin is not None:
            # Prevent admin from de-admining themselves if they are the one making the request
            # This is a basic safety, more complex logic might be needed (e.g., last admin check)
            if int(admin_user["user_id"]) == int(target_user_id) and not bool(is_admin):
                 return Response({"detail": "Admin cannot remove their own admin privileges through this endpoint."}, status=status.HTTP_400_BAD_REQUEST)
            update_fields.append("usr_admin = %s")
            update_values.append(bool(is_admin))

        if usr_access is not None:
            update_fields.append("usr_access = %s")
            update_values.append(usr_access)
        
        if not update_fields:
            return Response({"detail": "No update data provided."}, status=status.HTTP_400_BAD_REQUEST)

        update_values.append(target_user_id) # For the WHERE clause

        conn = get_db_connection()
        cur = conn.cursor()
        conn.autocommit = False
        try:
            # Check if user exists before updating
            cur.execute("SELECT usr_id FROM usr_info WHERE usr_id = %s", (target_user_id,))
            if not cur.fetchone():
                return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)

            query = f"UPDATE usr_info SET {', '.join(update_fields)} WHERE usr_id = %s"
            cur.execute(query, tuple(update_values))
            conn.commit()

            # Fetch updated user details to return
            cur.execute("SELECT usr_id, usr_login, usr_admin, usr_access FROM usr_info WHERE usr_id = %s", (target_user_id,))
            updated_user = cur.fetchone()
            return Response({
                "response": f"User ID {target_user_id} updated successfully.",
                "user": {
                    "id": updated_user[0],
                    "username": updated_user[1],
                    "is_admin": updated_user[2],
                    "access": updated_user[3]
                }
            }, status=status.HTTP_200_OK)
        except psycopg2.Error as db_error:
            conn.rollback()
            raise APIException(f"Database error: {db_error}")
        except ValidationError as ve:
            conn.rollback()
            raise ve
        finally:
            cur.close()
            conn.close()

    def delete(self, request, target_user_id):
        try:
            admin_user = get_admin_user_from_token(request)
        except APIException as e:
            return Response({"detail": e.detail}, status=e.status_code)
        
        # Basic check to prevent admin from deleting themselves
        if int(admin_user["user_id"]) == int(target_user_id):
            return Response({"detail": "Admin cannot delete themselves through this interface."}, status=status.HTTP_400_BAD_REQUEST)

        conn = get_db_connection()
        cur = conn.cursor()
        conn.autocommit = False
        try:
            cur.execute("SELECT usr_id FROM usr_info WHERE usr_id = %s", (target_user_id,))
            if not cur.fetchone():
                return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)

            cur.execute("DELETE FROM usr_info WHERE usr_id = %s", (target_user_id,))
            conn.commit()
            if cur.rowcount == 0: # Should be caught by the check above, but as a safeguard
                return Response({"detail": "User not found or already deleted."}, status=status.HTTP_404_NOT_FOUND)
            return Response({"response": f"User ID {target_user_id} deleted successfully."}, status=status.HTTP_200_OK) # Or HTTP_204_NO_CONTENT
        except psycopg2.Error as db_error:
            conn.rollback()
            raise APIException(f"Database error: {db_error}")
        finally:
            cur.close()
            conn.close()
            
@method_decorator(csrf_exempt, name='dispatch') # If you're using this for other admin views
class AdminListAllServicesView(APIView):
    authentication_classes = [] # Custom token handling
    permission_classes = [AllowAny] # Custom permission check in method

    def get(self, request):
        try:
            # Ensure only an admin user can access this list
            get_admin_user_from_token(request) 
        except APIException as e:
            return Response({"detail": e.detail}, status=e.status_code)

        conn = get_db_connection()
        cur = conn.cursor()
        try:
            # Fetch all services. Adjust columns if needed, but srv_id and srv_name are key.
            cur.execute("SELECT srv_id, srv_name, srv_desc FROM services_info ORDER BY srv_name")
            services_data = cur.fetchall()
            
            services_list = [
                {
                    "srv_id": row[0], 
                    "srv_name": row[1], 
                    "srv_desc": row[2]
                } for row in services_data
            ]
            return Response(services_list, status=status.HTTP_200_OK)
        except psycopg2.Error as e:
            # Log the error e
            raise APIException(f"Database query error while fetching all services: {e}")
        finally:
            cur.close()
            conn.close()