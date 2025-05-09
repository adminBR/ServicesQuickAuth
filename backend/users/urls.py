from django.contrib import admin
from django.urls import path,include

from .views import SumView,ping

urlpatterns = [
    path('admin/', admin.site.urls),
    path('teste/',SumView.as_view()),
    path('teste2/',ping)
]
