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

    # Admin pages
    path('user_management/', views.user_management_view, name='user_management'),
    path('system-settings/', views.system_settings_view, name='system_settings'),
    
    # Authentication pages
    path('login/', views.login_view, name='login'),
    path('register/', views.register_view, name='register'),
    path('logout/', views.logout_view, name='logout'),
    
    # APIs - No authentication required
    path('api/', include(router.urls)),
    path('api/dashboard/', dashboard_data, name='api-dashboard'),
    path('utilities/consumption/latest/', views.get_utility_consumption, name='utility-consumption'),
    path('dashboard/data/', views.get_dashboard_data, name='dashboard-data'),

    path('admin/', views.admin_dashboard, name='admin_dashboard'),
    path('operator/', views.operator_dashboard, name='operator_dashboard'),
    path('viewer', views.viewer_dashboard, name='viewer_dashboard'),
    
    # API endpoints
    path('api/data/', views.dashboard_data_api, name='dashboard_data_api'),
    path('api/operator-data/', views.operator_data_api, name='operator_data_api'),
    path('api/admin-metrics/', views.admin_metrics_api, name='admin_metrics_api'),
    path('api/update-production/', views.update_production_status, name='update_production_status'),
    path('api/submit-utility/', views.submit_utility_reading, name='submit_utility_reading'),

    # JWT Authentication APIs (optional)
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/register/', RegisterView.as_view(), name='api_register'),

     # Utilities Analytics APIs
    path('api/utilities/analytics/', utilities_analytics, name='utilities-analytics'),
    path('api/utilities/monthly/', monthly_consumption, name='monthly-consumption'),
    path('api/orders/<str:order_id>/utilities/', order_utilities_detail, name='order-utilities-detail'),
    path('api/orders/<str:order_id>/update-utilities/', update_order_utilities, name='update-order-utilities'),

     # Fix production order utilities
    path('api/orders/<str:order_id>/utilities/', views.order_utilities_detail, name='order-utilities-detail'),
    path('api/orders/<str:order_id>/update-utilities/', views.update_order_utilities, name='update-order-utilities'),
    path('setup-admin/', views.create_admin_view, name='create_admin'),
    path('api/system-action/', views.perform_system_action, name='perform_system_action'),
    path('api/submit-utility/', views.submit_utility_reading, name='submit_utility_reading'),
    path('api/operator-data/', views.operator_data_api, name='operator_data_api'),
    path('api/admin-metrics/', views.admin_metrics_api, name='admin_metrics_api'),
    path('api/update-production/', views.update_production_status, name='update_production_status'),
]