from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError,APIException
from rest_framework.request import Request

import jwt
import psycopg2
from datetime import datetime,timedelta,timezone

from .serializers import addServiceSerializer,updateServiceSerializer

from rest_framework.permissions import IsAuthenticated
#from .auth import JWTCustomAuth

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
        print(request.data)
        serializer = addServiceSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        item = serializer.validated_data
        
        try:
            cur.execute("insert into services_info (srv_image, srv_name, srv_ip, srv_desc) values(%s,%s,%s,%s) returning srv_id",
                        (item['srv_image'],item['srv_name'],item['srv_ip'],item['srv_desc'],))
            result = cur.fetchone()
            conn.commit()
        
        except psycopg2.Error as e:
            conn.rollback()
            raise APIException(f"Insert failed. {e}")
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