from django.urls import path, include
from rest_framework import routers
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from . import views

router = routers.DefaultRouter()
router.register('powders', views.PowderViewSet)
router.register('tasks', views.TaskViewSet)
router.register('qc-reports', views.QCReportViewSet)
router.register('gas-records', views.GasRecordViewSet)

urlpatterns = [
    # REST API (CRUD)
    path('api/', include(router.urls)),

    # Auth
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/register/', views.register, name='register'),
    path('api/me/', views.me, name='me'),

    # Dashboard KPIs
    path('api/dashboard-summary/', views.dashboard_summary, name='dashboard_summary'),
]