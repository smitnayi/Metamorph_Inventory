from django.urls import path, include
from rest_framework import routers
from . import views
from .views import (ProductionLogViewSet, RegisterView, dashboard_data, 
                   PowderViewSet, ProductionOrderViewSet, QCReportViewSet, 
                   UtilityDataViewSet, powder_list, powder_detail)
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

router = routers.DefaultRouter()
router.register('production-logs', ProductionLogViewSet)
router.register('powders', PowderViewSet)
router.register('production-orders', ProductionOrderViewSet)
router.register('qc-reports', QCReportViewSet)
router.register('utility-data', UtilityDataViewSet)

urlpatterns = [
    # Frontend pages
    path('', views.index, name='dashboard'),
    path('inventory/', views.inventory, name='inventory'),
    path('production/', views.production, name='production'),
    path('qc/', views.qc, name='qc'),
    path('utilities/', views.utility, name='utilities'),    
    path('profile/', views.profile_view, name='profile'),
    
    # Authentication pages
    path('login/', views.login_view, name='login'),
    path('register/', views.register_view, name='register'),
    path('logout/', views.logout_view, name='logout'),
    
    # APIs
    path('api/', include(router.urls)),
    path('api/dashboard/', dashboard_data, name='api-dashboard'),
    path('api/powders/', powder_list, name='powder-list'),
    path('api/powders/<int:pk>/', powder_detail, name='powder-detail'),

    # JWT Authentication APIs
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/register/', RegisterView.as_view(), name='api_register'),
]
