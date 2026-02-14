from django.shortcuts import render, redirect
from rest_framework import viewsets, status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth import get_user_model  # CHANGED: Replace User import
from django.contrib import messages
from rest_framework.views import APIView
from .models import ProductionLog, UserProfile, Powder, ProductionOrder, QCReport, UtilityData, UtilityConsumption
from .serializers import (
    ProductionLogSerializer, UserSerializer, PowderSerializer, 
    ProductionOrderSerializer, QCReportSerializer, UtilityDataSerializer
)
from django.contrib.auth.decorators import login_required
from django.db.models import F, Sum, Count, Avg
from datetime import date, datetime, timedelta
from django.http import HttpResponseForbidden, JsonResponse, HttpResponse
from django.utils import timezone
import json

# CHANGED: Get the custom user model
User = get_user_model()

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
        user_role = request.user.role if request.user.is_authenticated else 'operator'
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

@api_view(['GET'])
def executive_overview_data(request):
    """API endpoint for executive overview data with proper calculations"""
    try:
        # Get total powder stock
        total_stock = Powder.objects.aggregate(total=Sum('current_stock'))['total'] or 0
        
        # Get powders below threshold
        critical_powders = Powder.objects.filter(current_stock__lte=F('min_level')).count()
        
        # Get latest QC pass rate from actual QC reports
        total_qc_reports = QCReport.objects.count()
        passed_qc_reports = QCReport.objects.filter(result='passed').count()
        qc_pass_rate = (passed_qc_reports / total_qc_reports * 100) if total_qc_reports > 0 else 0
        
        # Get today's utility data - use filter().first() to avoid multiple objects error
        today = date.today()
        utility_data = UtilityData.objects.filter(date=today).first()
        
        if utility_data:
            gas_consumption = utility_data.gas_consumption
            electricity_usage = utility_data.electricity_usage
        else:
            gas_consumption = 0
            electricity_usage = 0
        
        data = {
            'powderStock': {
                'status': "Critical Low" if critical_powders > 0 else "Normal",
                'belowThreshold': critical_powders
            },
            'stockLevels': {
                'current': total_stock,
                'unit': 'kg',
                'dailyChange': "+3%"  # You can implement actual calculation later
            },
            'qcPassRate': {
                'current': round(qc_pass_rate, 1),
                'unit': '%',
                'dailyChange': "+3%"  # You can implement actual calculation later
            },
            'utilities': {
                'gas': {
                    'current': gas_consumption,
                    'unit': 'm³'
                },
                'electricity': {
                    'current': electricity_usage,
                    'unit': 'kWh'
                }
            }
        }
        return JsonResponse(data)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@api_view(['GET'])
def utilities_data(request):
    """API endpoint for utilities data"""
    try:
        # Get today's utility data - use filter().first() to avoid multiple objects error
        today = date.today()
        utility_data = UtilityData.objects.filter(date=today).first()
        
        if utility_data:
            gas_consumption = utility_data.gas_consumption
            electricity_usage = utility_data.electricity_usage
            water_usage = utility_data.water_usage
        else:
            gas_consumption = 0
            electricity_usage = 0
            water_usage = 0
        
        data = {
            'gas': {
                'current': gas_consumption,
                'unit': 'm³'
            },
            'electricity': {
                'current': electricity_usage,
                'unit': 'kWh'
            },
            'water': {
                'current': water_usage,
                'unit': 'm³'
            }
        }
        return JsonResponse(data)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@api_view(['POST'])
def add_utility_consumption(request):
    """API endpoint to add utility consumption data"""
    if request.method == 'POST':
        try:
            # Get or create today's utility data using update_or_create to handle duplicates
            today = date.today()
            
            # Use update_or_create to handle existing dates properly
            utility_data, created = UtilityData.objects.update_or_create(
                date=today,
                defaults={
                    'gas_consumption': float(request.data.get('gas_consumption', 0)),
                    'electricity_usage': float(request.data.get('electricity_usage', 0)),
                    'water_usage': float(request.data.get('water_usage', 0)),
                    'powder_consumption': float(request.data.get('powder_consumption', 0)),
                    'powder_type': request.data.get('powder_type', '')
                }
            )
            
            return JsonResponse({
                'success': True, 
                'message': 'Utility data updated successfully!',
                'data': {
                    'gas': utility_data.gas_consumption,
                    'electricity': utility_data.electricity_usage,
                    'water': utility_data.water_usage,
                    'powder': utility_data.powder_consumption
                }
            })
            
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})
    
    return JsonResponse({'success': False, 'error': 'Invalid request method'})

@api_view(['GET'])
def get_utility_consumption(request):
    """API endpoint for latest utility consumption"""
    try:
        latest_utility = UtilityConsumption.objects.order_by('-timestamp').first()
        
        if latest_utility:
            data = {
                'gas': latest_utility.gas_consumption,
                'electricity': latest_utility.electricity_usage,
                'timestamp': latest_utility.timestamp.isoformat()
            }
        else:
            data = {
                'gas': 0,
                'electricity': 0,
                'timestamp': timezone.now().isoformat()
            }
            
        return Response(data)
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['GET'])
def get_dashboard_data(request):
    """Combined dashboard data with utility information"""
    try:
        # Get base dashboard data (your existing function)
        base_data = get_base_dashboard_data()
        
        # Get latest utility consumption
        latest_utility = UtilityConsumption.objects.order_by('-timestamp').first()
        
        # Calculate Total Inventory Value
        total_value = Powder.objects.aggregate(
            total_value=Sum(F('current_stock') * F('price_per_kg'))
        )['total_value'] or 0

        # Recent Activity (mix of logs and orders for now, or just orders)
        recent_activity = ProductionOrder.objects.all().order_by('-created_at')[:5].values(
            'product_name', 'status', 'quantity', 'created_at', 'order_id'
        )

        # Merge data
        dashboard_data = {
            **base_data,
            'total_inventory_value': total_value,
            'gas_consumption': latest_utility.gas_consumption if latest_utility else 0,
            'electricity_usage': latest_utility.electricity_usage if latest_utility else 0,
            'utility_timestamp': latest_utility.timestamp.isoformat() if latest_utility else None,
            'recent_activity': list(recent_activity),
            # Mock data for charts if no real historical data is easily available
            'monthly_usage': [65, 59, 80, 81, 56, 55, 40],
            'chart_labels': ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
        }
        
        return Response(dashboard_data)
    except Exception as e:
        return Response({'error': str(e)}, status=500)

def get_base_dashboard_data():
    """Your existing function for base dashboard data"""
    total_stock = Powder.objects.aggregate(total=Sum('current_stock'))['total'] or 0
    return {
        'powder_stock': total_stock,
        'oc_pass_rate': 94.5, # Keep hardcoded if calculation is complex or missing data
        'active_jobs': ProductionOrder.objects.filter(status='in_progress').count(),
        'powder_stock_alert': 'Critical' if Powder.objects.filter(current_stock__lte=F('min_level')).exists() else 'Normal',
        'powders_below_threshold': Powder.objects.filter(current_stock__lte=F('min_level')).count(),
    }

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
            # Use your CustomUser model
            user = User.objects.create_user(
                username=username, 
                email=email, 
                password=password,
                first_name=first_name,
                last_name=last_name,
                role='operator'  # Set default role
            )
            
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
                user_role = getattr(request.user, 'role', 'viewer')
                
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
@role_required(['admin', 'manager', 'qc', 'operator'])
def qc(request):
    qc_reports = QCReport.objects.all().order_by('-created_at')  # CHANGED: use created_at instead of test_date
    return render(request, 'qc.html', {'qc_reports': qc_reports})

@login_required
@role_required(['admin', 'manager', 'operator'])
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

@login_required
def dashboard_view(request):
    """Main dashboard view that handles all roles"""
    user_role = getattr(request.user, 'userprofile', None)
    
    if user_role:
        role = user_role.role
    else:
        # Default to viewer if no profile
        role = 'viewer'
    
    context = {
        'user': request.user,
        'user_role': role,
    }
    return render(request, 'dashboard.html', context)

@login_required
def admin_dashboard(request):
    """Admin-specific dashboard"""
    if not hasattr(request.user, 'userprofile') or request.user.userprofile.role != 'admin':
        return HttpResponseForbidden("You don't have permission to access this page")
    
    context = {
        'user': request.user,
    }
    return render(request, 'dashboard.html')

@login_required
def operator_dashboard(request):
    """Operator-specific dashboard"""
    if not hasattr(request.user, 'userprofile') or request.user.userprofile.role not in ['admin', 'operator']:
        return HttpResponseForbidden("You don't have permission to access this page")
    
    context = {
        'user': request.user,
    }
    return render(request, 'dashboard.html')

@login_required
def viewer_dashboard(request):
    """Viewer-specific dashboard"""
    if not request.user.is_authenticated:
        return HttpResponseForbidden("You need to be logged in")
    
    context = {
        'user': request.user,
    }
    return render(request, 'dashboard.html')

# API Views
@login_required
def dashboard_data_api(request):
    """API endpoint for dashboard data"""
    # Get utility data from database
    latest_utility = UtilityConsumption.objects.order_by('-timestamp').first()
    
    data = {
        'overview': {
            'powderStock': {
                'status': 'Critical',
                'belowThreshold': 3
            },
            'stockLevels': {
                'current': 2450,
                'unit': 'kg',
                'dailyChange': '+2.5%'
            },
            'qcPassRate': {
                'current': 94.5,
                'unit': '%',
                'dailyChange': '+1.2%'
            }
        },
        'utilities': {
            'gas': {
                'current': latest_utility.gas_consumption if latest_utility else 0,
                'unit': 'm³'
            },
            'electricity': {
                'current': latest_utility.electricity_usage if latest_utility else 0,
                'unit': 'kWh'
            }
        }
    }
    
    return JsonResponse(data)

@login_required
def operator_data_api(request):
    """API endpoint for operator-specific data"""
    if not hasattr(request.user, 'userprofile') or request.user.userprofile.role not in ['admin', 'operator']:
        return JsonResponse({'error': 'Permission denied'}, status=403)
    
    data = {
        'productionTasks': [
            {
                'id': 1,
                'name': 'Line 1 - Powder Coating',
                'line': 'Production Line 1',
                'status': 'in_progress'
            },
            {
                'id': 2,
                'name': 'Line 2 - Quality Check',
                'line': 'Production Line 2',
                'status': 'pending'
            }
        ]
    }
    
    return JsonResponse(data)

@login_required
def admin_metrics_api(request):
    """API endpoint for admin metrics"""
    if not hasattr(request.user, 'userprofile') or request.user.userprofile.role != 'admin':
        return JsonResponse({'error': 'Admin access required'}, status=403)
    
    data = {
        'systemMetrics': {
            'activeUsers': 12,
            'systemLoad': '45%',
            'storageUsed': '2.3/10GB'
        }
    }
    
    return JsonResponse(data)

@login_required
def update_production_status(request):
    """Update production status (Operators and Admins only)"""
    if not hasattr(request.user, 'userprofile') or request.user.userprofile.role not in ['admin', 'operator']:
        return JsonResponse({'error': 'Permission denied'}, status=403)
    
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            task_id = data.get('task_id')
            status = data.get('status')
            
            # Update task in database - add your logic here
            print(f"Updating task {task_id} to status {status}")
            
            return JsonResponse({'success': True, 'message': 'Status updated'})
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
    
    return JsonResponse({'error': 'Method not allowed'}, status=405)

@login_required
def submit_utility_reading(request):
    """Submit utility readings (Operators and Admins only)"""
    if not hasattr(request.user, 'userprofile') or request.user.userprofile.role not in ['admin', 'operator']:
        return JsonResponse({'error': 'Permission denied'}, status=403)
    
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            utility_type = data.get('type')
            value = data.get('value')
            
            # Save to database
            if utility_type == 'gas':
                UtilityConsumption.objects.create(
                    gas_consumption=float(value),
                    electricity_usage=0
                )
            elif utility_type == 'electricity':
                UtilityConsumption.objects.create(
                    gas_consumption=0,
                    electricity_usage=float(value)
                )
            
            return JsonResponse({'success': True, 'message': 'Reading submitted'})
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
    
    return JsonResponse({'error': 'Method not allowed'}, status=405)

@login_required
def user_management_view(request):
    """User management page (Admin only)"""
    if getattr(request.user, 'role', 'viewer') != 'admin':
        return HttpResponseForbidden("You don't have permission to access this page")
        
    # Use get_user_model() to get the custom user model
    from django.contrib.auth import get_user_model
    User = get_user_model()
    
    users = User.objects.all().order_by('date_joined')
    context = {
        'users': users
    }
    # CHANGED: Use just 'user_management.html' without 'users/' prefix
    return render(request, 'user_management.html', context)

@login_required
def system_settings_view(request):
    """System settings page (Admin only)"""
    if getattr(request.user, 'role', 'viewer') != 'admin':
        return HttpResponseForbidden("You don't have permission to access this page")
    
    return render(request, 'system_settings.html')

def create_admin_view(request):
    User = get_user_model()
    try:
        # Get or create the admin user
        if User.objects.filter(username='admin').exists():
            user = User.objects.get(username='admin')
            user.set_password('admin123')
            user.is_staff = True
            user.is_superuser = True
            user.save()
            msg = "Updated existing 'admin' user with password 'admin123' and superuser status."
        else:
            user = User.objects.create_superuser('admin', 'admin@example.com', 'admin123')
            msg = "Created new superuser 'admin' with password 'admin123'."

        # Try to set role if using CustomUser or Profile
        try:
            user.role = 'admin'
            user.save()
        except:
            pass
            
        return HttpResponse(msg + " Please log in and change it immediately!")
    except Exception as e:
        return HttpResponse(f"Error creating/updating superuser: {str(e)}")

@api_view(['POST'])
def submit_utility_reading(request):
    """API endpoint to submit utility readings"""
    try:
        today = date.today()
        # Get existing data or create new
        utility_data, created = UtilityData.objects.get_or_create(date=today)
        
        # Update fields if present in request
        if 'gas_consumption' in request.data:
            utility_data.gas_consumption = float(request.data['gas_consumption'])
        if 'electricity_usage' in request.data:
            utility_data.electricity_usage = float(request.data['electricity_usage'])
        if 'water_usage' in request.data:
            utility_data.water_usage = float(request.data['water_usage'])
            
        utility_data.save()
        
        # Also create a UtilityConsumption record for history
        UtilityConsumption.objects.create(
            gas_consumption=request.data.get('gas_consumption', 0),
            electricity_usage=request.data.get('electricity_usage', 0),
            water_usage=request.data.get('water_usage', 0),
            timestamp=timezone.now()
        )
        
        return Response({'success': True, 'message': 'Utility data saved successfully'})
    except Exception as e:
        return Response({'success': False, 'error': str(e)}, status=500)

@api_view(['GET'])
def operator_data_api(request):
    """API for operator-specific data"""
    try:
        # Placeholder for production tasks (can be expanded)
        tasks = []
        production_orders = ProductionOrder.objects.filter(status='in_progress')
        for order in production_orders:
            tasks.append({
                'id': order.id,
                'name': f"Order #{order.id} - {order.powder.name}",
                'line': 'Line 1',  # Placeholder
                'status': order.status
            })
            
        return Response({'productionTasks': tasks})
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['GET'])
def admin_metrics_api(request):
    """API for admin-specific metrics"""
    try:
        User = get_user_model()
        active_users = User.objects.filter(is_active=True).count()
        return Response({
            'systemMetrics': {
                'activeUsers': active_users,
                'dbStatus': 'Healthy'
            }
        })
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['POST'])
def update_production_status(request):
    """API to update production task status"""
    try:
        task_id = request.data.get('taskId')
        status = request.data.get('status')
        
        if task_id and status:
            order = ProductionOrder.objects.get(id=task_id)
            order.status = status
            if status == 'completed':
                order.completed_at = timezone.now()
            order.save()
            return Response({'success': True})
        return Response({'success': False, 'error': 'Missing data'}, status=400)
    except Exception as e:
        return Response({'success': False, 'error': str(e)}, status=500)

@api_view(['POST'])
def perform_system_action(request):
    """API for system actions"""
    try:
        action = request.data.get('action')
        # Placeholder for actual system actions
        return Response({'success': True, 'message': f'Action {action} processed'})
    except Exception as e:
        return Response({'success': False, 'error': str(e)}, status=500)