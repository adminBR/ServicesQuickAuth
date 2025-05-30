from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError,APIException
from rest_framework.request import Request
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FileUploadParser # For file uploads

import psycopg2
from datetime import datetime,timedelta,timezone

from .serializers import addServiceSerializer,updateServiceSerializer
from utils.database import get_db_connection
from utils.jwt import get_admin_user_from_token

import os
import base64


class ServicesManager(APIView):
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
    
class ImageManager(APIView):
    permission_classes = [IsAuthenticated] # Or adjust as needed
    parser_classes = (MultiPartParser, FileUploadParser) # To handle file uploads
    
    def get(self, request):
        conn = get_db_connection()
        cur = conn.cursor()
        try:
            cur.execute("SELECT img_id, img_name, img_data, created_at FROM img_info ORDER BY img_id")
            users_data = cur.fetchall()
            users_list = [
                {
                    "id": row[0],
                    "img_name": row[1],
                    # Option 1: Return as base64 string (warning: large size!)
                    "img_base64": base64.b64encode(row[2]).decode('utf-8') if row[2] else None,
                    "created_at": row[3].isoformat() if row[3] else None
                } for row in users_data
            ]
            return Response(users_list, status=status.HTTP_200_OK)
        except psycopg2.Error as e:
            raise APIException(f"Database query error: {e}")
        finally:
            cur.close()
            conn.close()

    def post(self, request: Request):
        try:
            get_admin_user_from_token(request)
        except APIException as e:
            return Response({"detail": e.detail}, status=e.status_code)
        
        if 'file' not in request.data:
            raise ValidationError({"detail": "No file provided."})

        uploaded_file = request.data['file']
        allowed_extensions = ['.jpg', '.jpeg', '.png', '.gif']
        filename, file_extension = os.path.splitext(uploaded_file.name)
        if file_extension.lower() not in allowed_extensions:
            raise ValidationError({"detail": f"File type not allowed. Allowed types: {', '.join(allowed_extensions)}"})

        file_bytes = uploaded_file.read()  # Read the file into bytes

        conn = get_db_connection()
        cur = conn.cursor()
        conn.autocommit = False
        try:
            cur.execute("""
                INSERT INTO img_info (img_name, img_data, created_at)
                VALUES (%s, %s, %s)
            """, (uploaded_file.name, psycopg2.Binary(file_bytes), datetime.now(tz=timezone.utc)))
            conn.commit()
        except psycopg2.Error as db_error:
            conn.rollback()
            raise APIException(f"Database error: {db_error}")
        finally:
            cur.close()
            conn.close()

        return Response({
            "message": "File uploaded successfully",
            "filename": uploaded_file.name,
        }, status=201)
