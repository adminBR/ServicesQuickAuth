from django.contrib import admin
from django.urls import path,include
from .views import serviceManaging,ImageUploadView

urlpatterns = [
    path('item/',serviceManaging.as_view()),
    path('upload-image/', ImageUploadView.as_view()),
]