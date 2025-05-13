from django.contrib import admin
from django.urls import path,include
from .views import serviceManaging

urlpatterns = [
    path('item/',serviceManaging.as_view()),
]