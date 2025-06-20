from django.contrib import admin
from django.urls import path,include
from .views import ServicesManager,ServicesManagerUpdate,SshManager

urlpatterns = [
    path('',ServicesManager.as_view()),
    path('<int:service_id>',ServicesManagerUpdate.as_view()),
    path('ssh',SshManager.as_view())
]