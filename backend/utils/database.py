from rest_framework.exceptions import APIException
import psycopg2

DB_HOST = '192.168.1.64'
DB_NAME = 'auth_service'
DB_USER = 'postgres'
DB_PASSWORD = 'postgres'

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