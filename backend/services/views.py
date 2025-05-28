from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError,APIException
from rest_framework.request import Request
from rest_framework import status

import jwt
import psycopg2
from datetime import datetime,timedelta,timezone

from .serializers import addServiceSerializer,updateServiceSerializer

from rest_framework.permissions import IsAuthenticated
#from .auth import JWTCustomAuth
from rest_framework.parsers import MultiPartParser, FileUploadParser # For file uploads
from django.conf import settings
from django.core.files.storage import FileSystemStorage
import os # Make sure to import os

import re
import json

DB_HOST = '192.168.1.64'
DB_NAME = 'auth_service'
DB_USER = 'postgres'
DB_PASSWORD = 'postgres'


# Password validation settings
MIN_PASSWORD_LENGTH = 6
PASSWORD_REGEX = re.compile(r'^(?=.*[A-Za-z])(?=.*\d).+$')  # At least one letter and one number


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

class serviceManaging(APIView):
    
    permission_classes = [IsAuthenticated]
    
    def get(self, request: Request):
        user_id = request.user.id
        conn = get_db_connection()
        cur = conn.cursor()
        
        try:
            cur.execute("SELECT usr_access FROM usr_info ui WHERE ui.usr_id = %s", (user_id,))
            result = cur.fetchone()
            user_services = result[0]

            cur.execute(f"SELECT * FROM services_info si WHERE si.srv_id IN ({user_services})")
            result = cur.fetchall()

            header = [desc[0] for desc in cur.description]
            fullresult = [dict(zip(header, row)) for row in result]

            return Response({"message": "success", "content": fullresult})
        finally:
            cur.close()
            conn.close()

        
    def post(self,request:Request):
        conn = get_db_connection()
        cur = conn.cursor()
        conn.autocommit = False
        user_id = request.user.id
        print(request.data)
        serializer = addServiceSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        item = serializer.validated_data
        
        try:
            cur.execute("insert into services_info (srv_image, srv_name, srv_ip, srv_desc) values(%s,%s,%s,%s) returning srv_id",
                        (item['srv_image'],item['srv_name'],item['srv_ip'],item['srv_desc'],))
            result = cur.fetchone()
            service_id = result[0]
            cur.execute("SELECT usr_access FROM usr_info WHERE usr_id = %s", (user_id,))
            _result_user_access = cur.fetchone()[0]
            
            if not _result_user_access:
                return Response({"detail": "User not found"}, status=status.HTTP_401_UNAUTHORIZED)

            allowed_services = _result_user_access.split(",")
            if service_id not in allowed_services:
                _result_user_access = f"{_result_user_access},{result[0]}"
                cur.execute("update usr_info set usr_access = %s WHERE usr_id = %s", (_result_user_access,user_id,))
            conn.commit()
        
        except psycopg2.Error as e:
            conn.rollback()
            print(e)
            raise APIException(f"Insert failed. {e}")
        except Exception as e:
            print(e)
        finally:
            cur.close()
            conn.close()

        return Response({"message":"Success","id":result[0]})
    
    def put(self,request:Request):
        conn = get_db_connection()
        cur = conn.cursor()
        conn.autocommit = False
        
        serializer = updateServiceSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        item = serializer.validated_data
        
        query = "UPDATE services_info SET "
        fields = []
        values = []

        if item.get('srv_image'):
            fields.append("srv_image = %s")
            values.append(item['srv_image'])

        if item.get('srv_name'):
            fields.append("srv_name = %s")
            values.append(item['srv_name'])

        if item.get('srv_ip'):
            fields.append("srv_ip = %s")
            values.append(item['srv_ip'])

        if item.get('srv_desc'):
            fields.append("srv_desc = %s")
            values.append(item['srv_desc'])

        query += ", ".join(fields) + " WHERE srv_id = %s"
        values.append(item['srv_id'])
        
        if not fields:
            raise ValidationError("No Fields being updated.")
        
        try:
            cur.execute(query, values)
            conn.commit()
        
        except psycopg2.Error as e:
            conn.rollback()
            raise APIException(f"Insert failed. {e}")
        finally:
            cur.close()
            conn.close()
        

        return Response({"message":"Success","id":item['srv_id']})
    
class ImageUploadView(APIView):
    permission_classes = [IsAuthenticated] # Or adjust as needed
    parser_classes = (MultiPartParser, FileUploadParser) # To handle file uploads

    def post(self, request: Request, *args, **kwargs):
        if 'file' not in request.data:
            raise ValidationError({"detail": "No file provided."})

        uploaded_file = request.data['file']
        
        # Basic validation for file type (optional, can be more robust)
        allowed_extensions = ['.jpg', '.jpeg', '.png', '.gif']
        filename, file_extension = os.path.splitext(uploaded_file.name)
        if file_extension.lower() not in allowed_extensions:
            raise ValidationError({"detail": f"File type not allowed. Allowed types: {', '.join(allowed_extensions)}"})

        # Ensure the media directory exists
        if not os.path.exists(settings.MEDIA_ROOT):
            os.makedirs(settings.MEDIA_ROOT)
            
        fs = FileSystemStorage(location=settings.MEDIA_ROOT) # Uses MEDIA_ROOT
        
        # Save the file
        # You might want to sanitize the filename or generate a unique one
        # to prevent overwrites or security issues.
        # For example, using uuid:
        # import uuid
        # unique_filename = f"{uuid.uuid4()}{file_extension}"
        # filename = fs.save(unique_filename, uploaded_file)
        
        filename = fs.save(uploaded_file.name, uploaded_file)
        file_url = fs.url(filename) # Generates the URL based on MEDIA_URL

        return Response({
            "message": "File uploaded successfully",
            "filename": filename,
            "file_url": request.build_absolute_uri(file_url) # Provides the full URL
        }, status=201)
