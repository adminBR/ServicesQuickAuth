from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError,APIException
from rest_framework.request import Request

import jwt
import psycopg2
from datetime import datetime,timedelta,timezone

from .serializers import addServiceSerializer,updateServiceSerializer

import re
import json

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

# Create your views here.
class serviceManaging(APIView):
    
    def get(self,request:Request):
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute("Select * from services_info")
        result = cur.fetchall()
        header = [desc[0] for desc in cur.description]
        fullresult = [dict(zip(header, row)) for row in result]
        
        return Response({"message":"success","content":fullresult})
        
    def post(self,request:Request):
        conn = get_db_connection()
        cur = conn.cursor()
        conn.autocommit = False
        
        serializer = addServiceSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        item = serializer.validated_data
        
        try:
            cur.execute("insert into services_info (srv_image, srv_name, srv_ip, srv_desc) values(%s,%s,%s,%s) returning srv_id",
                        (item['image'],item['name'],item['ip'],item['desc'],))
            result = cur.fetchone()
            conn.commit()
        
        except psycopg2.Error as e:
            conn.rollback()
            raise APIException(f"Insert failed. {e}")
        

        return Response({"message":"Success","id":result[0]})
    
    def put(self,request:Request):
        conn = get_db_connection()
        cur = conn.cursor()
        conn.autocommit = False
        
        serializer = updateServiceSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        item = serializer.validated_data
        print(item)
        
        query = "UPDATE services_info SET "
        fields = []
        values = []

        if item.get('image'):
            fields.append("srv_image = %s")
            values.append(item['image'])

        if item.get('name'):
            fields.append("srv_name = %s")
            values.append(item['name'])

        if item.get('ip'):
            fields.append("srv_ip = %s")
            values.append(item['ip'])

        if item.get('desc'):
            fields.append("srv_desc = %s")
            values.append(item['desc'])

        query += ", ".join(fields) + " WHERE srv_id = %s"
        values.append(item['id'])
        
        if not fields:
            raise ValidationError("No Fields being updated.")
        
        print(query)
        print(values)

        try:
            cur.execute(query, values)
            result = cur.fetchone()
            conn.commit()
        
        except psycopg2.Error as e:
            conn.rollback()
            raise APIException(f"Insert failed. {e}")
        

        return Response({"message":"Success","id":result[0]})