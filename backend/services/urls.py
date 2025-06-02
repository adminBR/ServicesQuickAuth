from django.contrib import admin
from django.urls import path,include
from .views import ServicesManager,ServicesManagerUpdate

urlpatterns = [
    path('',ServicesManager.as_view()),
    path('<int:service_id>',ServicesManagerUpdate.as_view())
]