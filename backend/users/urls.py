from django.contrib import admin
from django.urls import path,include

from .views import UserRegister,UserLogin,ValidateToken,RefreshToken,UserLogout,AdminUserOperationsView, AdminUserDetailOperationsView,AdminListAllServicesView

urlpatterns = [
    #path('register/',UserRegister.as_view()),
    path('login/',UserLogin.as_view()),
    path('logout',UserLogout.as_view()),
    path('validate',ValidateToken.as_view()),
    path('refresh/', RefreshToken.as_view()),
    path('admin/', AdminUserOperationsView.as_view(), name='admin-users-list-create'),
    path('admin/<int:target_user_id>/', AdminUserDetailOperationsView.as_view(), name='admin-user-detail-operations'),
     path('admin/services/all/', AdminListAllServicesView.as_view(), name='admin-list-all-services'),
]
