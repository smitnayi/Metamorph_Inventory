"""
URL configuration for backend project.
"""
from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
# Remove this line: from dashboard.views import RegisterView  # This was causing the issue

urlpatterns = [
    path('admin/', admin.site.urls),

    # Include all dashboard URLs
    path('', include('dashboard.urls')),  # This includes ALL dashboard URLs

    # JWT Authentication - these will be handled by dashboard app
    # path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    # path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    # path('api/register/', RegisterView.as_view(), name='register'),
]