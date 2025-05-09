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