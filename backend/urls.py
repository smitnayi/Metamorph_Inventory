"""
URL configuration for backend project.
"""
from django.contrib import admin
from django.urls import path, include
from django.shortcuts import redirect
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
# Remove this line: from dashboard.views import RegisterView  # This was causing the issue

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('dashboard.urls')),  # This includes ALL dashboard URLs
    path('users/', include('users.urls')),  # If you have users app
]

# Optional: Redirect root to dashboard
# urlpatterns += [
#     path('', lambda request: redirect('dashboard/')),
# ]

