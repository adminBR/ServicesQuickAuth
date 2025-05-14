from django.contrib import admin
from django.urls import path,include

from .views import UserRegister,UserLogin

urlpatterns = [
    path('register/',UserRegister.as_view()),
    path('login/',UserLogin.as_view()),
]
