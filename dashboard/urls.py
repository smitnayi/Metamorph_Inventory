# dashboard/urls.py
from django.urls import path, include
from rest_framework import routers
from . import views
from .views import (
    ProductionLogViewSet, RegisterView, dashboard_data,
    PowderViewSet, ProductionOrderViewSet, QCReportViewSet,
    UtilityDataViewSet, utilities_analytics, order_utilities_detail, update_order_utilities, monthly_consumption,
    executive_overview_data, utilities_data, add_utility_consumption  # ADD THESE
)
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
    
    # APIs - No authentication required
    path('api/', include(router.urls)),
    path('api/dashboard/', dashboard_data, name='api-dashboard'),

    # NEW API endpoints for data consistency
    path('api/executive-overview/', executive_overview_data, name='executive_overview_data'),
    path('api/utilities/current/', utilities_data, name='utilities_data'),
    path('api/utilities/add-consumption/', add_utility_consumption, name='add_utility_consumption'),

    # JWT Authentication APIs (optional)
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/register/', RegisterView.as_view(), name='api_register'),

     # Utilities Analytics APIs
    path('api/utilities/analytics/', utilities_analytics, name='utilities-analytics'),
    path('api/utilities/monthly/', monthly_consumption, name='monthly-consumption'),
    path('api/orders/<str:order_id>/utilities/', order_utilities_detail, name='order-utilities-detail'),
    path('api/orders/<str:order_id>/update-utilities/', update_order_utilities, name='update-order-utilities'),
]