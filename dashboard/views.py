from django.shortcuts import render, redirect, get_object_or_404
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.contrib import messages
from rest_framework.views import APIView
from django.db import models    
from .models import ProductionLog, UserProfile, Powder, ProductionOrder, QCReport, UtilityData
from .serializers import ProductionLogSerializer, UserSerializer, UserProfileSerializer, PowderSerializer, ProductionOrderSerializer, QCReportSerializer, UtilityDataSerializer
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator
from django.http import JsonResponse
import json
from datetime import date, timedelta


# Create your views here.

class ProductionLogViewSet(viewsets.ModelViewSet):
    queryset = ProductionLog.objects.all()
    serializer_class = ProductionLogSerializer
    permission_classes = [IsAuthenticated]

class PowderViewSet(viewsets.ModelViewSet):
    queryset = Powder.objects.all()
    serializer_class = PowderSerializer
    permission_classes = [IsAuthenticated]

class ProductionOrderViewSet(viewsets.ModelViewSet):
    queryset = ProductionOrder.objects.all()
    serializer_class = ProductionOrderSerializer
    permission_classes = [IsAuthenticated]

class QCReportViewSet(viewsets.ModelViewSet):
    queryset = QCReport.objects.all()
    serializer_class = QCReportSerializer
    permission_classes = [IsAuthenticated]

class UtilityDataViewSet(viewsets.ModelViewSet):
    queryset = UtilityData.objects.all()
    serializer_class = UtilityDataSerializer
    permission_classes = [IsAuthenticated]

class RegisterView(APIView):
    def post(self, request):
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            # Create user profile with default role
            UserProfile.objects.create(user=user, role='operator')
            return Response({"message": "User created successfully"}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_data(request):
    # Ensure user has a profile
    try:
        user_role = request.user.userprofile.role
    except UserProfile.DoesNotExist:
        UserProfile.objects.create(user=request.user, role='operator')
        user_role = 'operator'
    
    # Get real data from database
    total_powder_stock = sum(powder.current_stock for powder in Powder.objects.all())
    low_stock_items = Powder.objects.filter(current_stock__lte=models.F('min_level') * 1.2).count()
    critical_stock_items = Powder.objects.filter(current_stock__lte=models.F('min_level')).count()
    
    # Get today's utility data or create default
    today = date.today()
    utility_data, created = UtilityData.objects.get_or_create(
        date=today,
        defaults={'gas_consumption': 245, 'electricity_usage': 1847, 'water_usage': 320}
    )
    
    # Calculate QC pass rate
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
            # Create user profile
            UserProfile.objects.create(user=user, role='operator')
            login(request, user)
            return redirect('dashboard')
    return render(request, "register.html")

def logout_view(request):
    logout(request)
    return redirect('login')

# Enhanced Role-based permission decorator
def role_required(allowed_roles=[]):
    def decorator(view_func):
        def wrapper(request, *args, **kwargs):
            if request.user.is_authenticated:
                # Ensure user has a profile
                try:
                    user_role = request.user.userprofile.role
                except UserProfile.DoesNotExist:
                    # Create profile if it doesn't exist
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

# API views for dynamic data
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def powder_list(request):
    if request.method == 'GET':
        powders = Powder.objects.all()
        serializer = PowderSerializer(powders, many=True)
        return Response(serializer.data)
    elif request.method == 'POST':
        # Only admin, manager, operator can modify inventory
        user_role = request.user.userprofile.role
        if user_role not in ['admin', 'manager', 'operator']:
            return Response({"error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)
        
        serializer = PowderSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def powder_detail(request, pk):
    try:
        powder = Powder.objects.get(pk=pk)
    except Powder.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

    user_role = request.user.userprofile.role
    
    if request.method == 'GET':
        serializer = PowderSerializer(powder)
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        if user_role not in ['admin', 'manager', 'operator']:
            return Response({"error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)
        
        serializer = PowderSerializer(powder, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        if user_role not in ['admin', 'manager']:
            return Response({"error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)
        
        powder.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

# Similar API views for ProductionOrder, QCReport, etc.

# Protected views with role-based access
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
        # Handle profile updates
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