import jwt
def decorator(func):
    def wrapper(*args):
        print("Before calling the function.")
        func(*args)
        print("After calling the function.")
    return wrapper
    
@decorator
def greet(test):
    print(f"Hello, World! {test}")

greet('luis')

SECRET_KEY = "TESTE123"

def gentoken(payload):
    token = jwt.encode({"message":payload},SECRET_KEY,algorithm="HS256")
    return token

def exttoken(token):
    message = jwt.decode(token,SECRET_KEY,algorithms=["HS256"])
    return message

token = gentoken("teste message")
print(token)
message = exttoken(token)
print(message)
    