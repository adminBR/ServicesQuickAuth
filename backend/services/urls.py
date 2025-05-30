from django.contrib import admin
from django.urls import path,include
from .views import ServicesManager,ImageManager

urlpatterns = [
    path('/',ServicesManager.as_view()),
    path('image/', ImageManager.as_view()),
]