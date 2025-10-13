from django.shortcuts import render, redirect
from rest_framework import viewsets, status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.contrib import messages
from rest_framework.views import APIView
from .models import ProductionLog, UserProfile, Powder, ProductionOrder, QCReport, UtilityData
from .serializers import (
    ProductionLogSerializer, UserSerializer, PowderSerializer, 
    ProductionOrderSerializer, QCReportSerializer, UtilityDataSerializer
)
from django.contrib.auth.decorators import login_required
from django.db.models import F, Sum, Count, Avg
from datetime import date, datetime, timedelta

# Create your views here.

class ProductionLogViewSet(viewsets.ModelViewSet):
    queryset = ProductionLog.objects.all()
    serializer_class = ProductionLogSerializer

class PowderViewSet(viewsets.ModelViewSet):
    queryset = Powder.objects.all()
    serializer_class = PowderSerializer

class ProductionOrderViewSet(viewsets.ModelViewSet):
    queryset = ProductionOrder.objects.all()
    serializer_class = ProductionOrderSerializer

    def perform_create(self, serializer):
        # Automatically set created_by to current user
        if self.request.user.is_authenticated:
            serializer.save(created_by=self.request.user)
        else:
            # Fallback to admin user if not authenticated
            admin_user = User.objects.filter(is_superuser=True).first()
            serializer.save(created_by=admin_user)

    def perform_update(self, serializer):
        if self.request.user.is_authenticated:
            serializer.save(created_by=self.request.user)
        else:
            admin_user = User.objects.filter(is_superuser=True).first()
            serializer.save(created_by=admin_user)

class QCReportViewSet(viewsets.ModelViewSet):
    queryset = QCReport.objects.all()
    serializer_class = QCReportSerializer

    def perform_create(self, serializer):
        # Automatically set created_by to current user
        if self.request.user.is_authenticated:
            serializer.save(created_by=self.request.user)
        else:
            # Fallback to admin user if not authenticated
            admin_user = User.objects.filter(is_superuser=True).first()
            serializer.save(created_by=admin_user)

    def perform_update(self, serializer):
        if self.request.user.is_authenticated:
            serializer.save(created_by=self.request.user)
        else:
            admin_user = User.objects.filter(is_superuser=True).first()
            serializer.save(created_by=admin_user)

class UtilityDataViewSet(viewsets.ModelViewSet):
    queryset = UtilityData.objects.all()
    serializer_class = UtilityDataSerializer

class RegisterView(APIView):
    def post(self, request):
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            try:
                profile = user.userprofile
                profile.role = 'operator'
                profile.save()
            except UserProfile.DoesNotExist:
                UserProfile.objects.create(user=user, role='operator')
            return Response({"message": "User created successfully"}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
def dashboard_data(request):
    # Remove authentication check for now
    try:
        user_role = request.user.userprofile.role if request.user.is_authenticated else 'operator'
    except:
        user_role = 'operator'
    
    total_powder_stock = sum(powder.current_stock for powder in Powder.objects.all())
    low_stock_items = Powder.objects.filter(current_stock__lte=F('min_level') * 1.2).count()
    critical_stock_items = Powder.objects.filter(current_stock__lte=F('min_level')).count()
    
    today = date.today()
    utility_data, created = UtilityData.objects.get_or_create(
        date=today,
        defaults={'gas_consumption': 245, 'electricity_usage': 1847, 'water_usage': 320}
    )
    
    total_qc_reports = QCReport.objects.count()
    passed_qc_reports = QCReport.objects.filter(result='passed').count()
    qc_pass_rate = (passed_qc_reports / total_qc_reports * 100) if total_qc_reports > 0 else 0
    
    data = {
        "powder_stock": total_powder_stock,
        "low_stock_items": low_stock_items,
        "critical_stock_items": critical_stock_items,
        "job_works": ProductionOrder.objects.filter(status='in_progress').count(),
        "qc_reports": round(qc_pass_rate, 1),
        "electricity": utility_data.electricity_usage,
        "gas": utility_data.gas_consumption,
        "user_role": user_role
    }
    return Response(data)

# Add these new views for utilities analytics
@api_view(['GET'])
def utilities_analytics(request):
    """Get utilities consumption analytics for the last 7 days"""
    end_date = datetime.now().date()
    start_date = end_date - timedelta(days=7)
    
    # Get daily utilities data
    utilities_data = []
    current_date = start_date
    
    while current_date <= end_date:
        # Get utility data for this date
        try:
            utility_data = UtilityData.objects.get(date=current_date)
            daily_electricity = utility_data.electricity_usage
            daily_gas = utility_data.gas_consumption
            daily_water = utility_data.water_usage
        except UtilityData.DoesNotExist:
            daily_electricity = 0
            daily_gas = 0
            daily_water = 0
        
        # Get orders completed on this date
        completed_orders = ProductionOrder.objects.filter(
            completed_at__date=current_date,
            status='completed'
        )
        
        total_orders = completed_orders.count()
        
        # Calculate efficiency (orders per 100 kWh)
        efficiency = (total_orders / daily_electricity * 100) if daily_electricity > 0 else 0
        
        utilities_data.append({
            'date': current_date,
            'total_electricity': daily_electricity,
            'total_gas': daily_gas,
            'total_water': daily_water,
            'total_orders': total_orders,
            'efficiency': round(efficiency, 2)
        })
        
        current_date += timedelta(days=1)
    
    return Response(utilities_data)

@api_view(['POST'])
def add_utility_data(request):
    """Add or update daily utility consumption data"""
    serializer = UtilityDataSerializer(data=request.data)
    if serializer.is_valid():
        # Use update_or_create to handle existing dates
        utility_data, created = UtilityData.objects.update_or_create(
            date=serializer.validated_data['date'],
            defaults=serializer.validated_data
        )
        return Response(UtilityDataSerializer(utility_data).data, 
                       status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
def order_utilities_detail(request, order_id):
    """Get utilities consumption for a specific order"""
    try:
        order = ProductionOrder.objects.get(order_id=order_id)
        data = {
            'order_id': order.order_id,
            'product_name': order.product_name,
            'electricity_used': order.electricity_used,
            'gas_used': order.gas_used,
            'water_used': order.water_used,
            'quantity': order.quantity,
            'status': order.status,
            'completed_at': order.completed_at
        }
        return Response(data)
    except ProductionOrder.DoesNotExist:
        return Response({"error": "Order not found"}, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
def update_order_utilities(request, order_id):
    """Update utilities consumption for a specific order"""
    try:
        order = ProductionOrder.objects.get(order_id=order_id)
        
        # Update utilities consumption
        if 'electricity_used' in request.data:
            order.electricity_used = request.data['electricity_used']
        if 'gas_used' in request.data:
            order.gas_used = request.data['gas_used']
        if 'water_used' in request.data:
            order.water_used = request.data['water_used']
        
        order.save()
        
        # Update today's utility data
        today = datetime.now().date()
        utility_data, created = UtilityData.objects.get_or_create(date=today)
        
        # Recalculate totals from all completed orders today
        today_orders = ProductionOrder.objects.filter(
            completed_at__date=today,
            status='completed'
        )
        
        utility_data.electricity_usage = today_orders.aggregate(Sum('electricity_used'))['electricity_used__sum'] or 0
        utility_data.gas_consumption = today_orders.aggregate(Sum('gas_used'))['gas_used__sum'] or 0
        utility_data.water_usage = today_orders.aggregate(Sum('water_used'))['water_used__sum'] or 0
        utility_data.save()
        
        return Response({"message": "Utilities updated successfully"})
        
    except ProductionOrder.DoesNotExist:
        return Response({"error": "Order not found"}, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
def monthly_consumption(request):
    """Get monthly consumption summary"""
    today = datetime.now().date()
    first_day = today.replace(day=1)
    
    # This month's consumption
    this_month_orders = ProductionOrder.objects.filter(
        completed_at__date__gte=first_day,
        status='completed'
    )
    
    this_month_data = this_month_orders.aggregate(
        total_electricity=Sum('electricity_used'),
        total_gas=Sum('gas_used'),
        total_water=Sum('water_used'),
        total_orders=Count('id')
    )
    
    # Last month's consumption
    last_month_end = first_day - timedelta(days=1)
    last_month_start = last_month_end.replace(day=1)
    
    last_month_orders = ProductionOrder.objects.filter(
        completed_at__date__gte=last_month_start,
        completed_at__date__lte=last_month_end,
        status='completed'
    )
    
    last_month_data = last_month_orders.aggregate(
        total_electricity=Sum('electricity_used'),
        total_gas=Sum('gas_used'),
        total_water=Sum('water_used'),
        total_orders=Count('id')
    )
    
    data = {
        'this_month': {
            'electricity': this_month_data['total_electricity'] or 0,
            'gas': this_month_data['total_gas'] or 0,
            'water': this_month_data['total_water'] or 0,
            'orders': this_month_data['total_orders'] or 0
        },
        'last_month': {
            'electricity': last_month_data['total_electricity'] or 0,
            'gas': last_month_data['total_gas'] or 0,
            'water': last_month_data['total_water'] or 0,
            'orders': last_month_data['total_orders'] or 0
        }
    }
    
    return Response(data)

# Authentication views
def index(request):
    if request.user.is_authenticated:
        return render(request, "dashboard.html")
    else:
        return redirect('login')

def login_view(request):
    if request.user.is_authenticated:
        return redirect('dashboard')
        
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            next_url = request.GET.get('next', 'dashboard')
            return redirect(next_url)
        else:
            messages.error(request, 'Invalid credentials')
    return render(request, "login.html")

def register_view(request):
    if request.user.is_authenticated:
        return redirect('dashboard')
        
    if request.method == 'POST':
        username = request.POST.get('username')
        email = request.POST.get('email')
        password = request.POST.get('password')
        first_name = request.POST.get('first_name', '')
        last_name = request.POST.get('last_name', '')
        
        if User.objects.filter(username=username).exists():
            messages.error(request, 'Username already exists')
        else:
            user = User.objects.create_user(
                username=username, 
                email=email, 
                password=password,
                first_name=first_name,
                last_name=last_name
            )
            try:
                profile = user.userprofile
                profile.role = 'operator'
                profile.save()
            except UserProfile.DoesNotExist:
                UserProfile.objects.create(user=user, role='operator')
            
            login(request, user)
            return redirect('dashboard')
    return render(request, "register.html")

def logout_view(request):
    logout(request)
    return redirect('login')

# Simple Role-based permission decorator (for frontend pages only)
def role_required(allowed_roles=[]):
    def decorator(view_func):
        def wrapper(request, *args, **kwargs):
            if request.user.is_authenticated:
                try:
                    user_role = request.user.userprofile.role
                except UserProfile.DoesNotExist:
                    UserProfile.objects.create(user=request.user, role='operator')
                    user_role = 'operator'
                
                if user_role in allowed_roles:
                    return view_func(request, *args, **kwargs)
                else:
                    messages.error(request, 'You do not have permission to access this page.')
                    return redirect('dashboard')
            else:
                return redirect('login')
        return wrapper
    return decorator

# Protected views with role-based access (frontend pages only)
@login_required
def dashboard(request):
    return render(request, 'dashboard.html')

@login_required
@role_required(['admin', 'manager', 'operator', 'qc', 'viewer'])
def inventory(request):
    powders = Powder.objects.all()
    return render(request, 'inventory.html', {'powders': powders})

@login_required
@role_required(['admin', 'manager', 'operator'])
def production(request):
    production_orders = ProductionOrder.objects.all().order_by('-created_at')
    return render(request, 'production.html', {'production_orders': production_orders})

@login_required
@role_required(['admin', 'manager', 'qc'])
def qc(request):
    qc_reports = QCReport.objects.all().order_by('-test_date')
    return render(request, 'qc.html', {'qc_reports': qc_reports})

@login_required
@role_required(['admin', 'manager'])
def utility(request):
    return render(request, 'utility.html')

# User profile view
@login_required
def profile_view(request):
    if request.method == 'POST':
        user = request.user
        user.first_name = request.POST.get('first_name', user.first_name)
        user.last_name = request.POST.get('last_name', user.last_name)
        user.email = request.POST.get('email', user.email)
        user.save()
        
        profile = user.userprofile
        profile.department = request.POST.get('department', profile.department)
        profile.phone = request.POST.get('phone', profile.phone)
        profile.save()
        
        messages.success(request, 'Profile updated successfully')
        return redirect('profile')
    
    return render(request, 'profile.html')