import json
from django.contrib.auth.decorators import login_required
from django.http import HttpResponseForbidden, JsonResponse
from django.shortcuts import render, redirect
from backend.users.models import CustomUser
from users.permissions import IsAdmin, IsOperatorOrAdmin, CanEditUtilities
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.contrib import messages
from .models import UserProfile
from django.contrib.auth.models import User

@login_required
def admin_dashboard(request):
    if not request.user.is_admin():
        return HttpResponseForbidden("You don't have permission to access this page")
    
    # Full access to all data
    context = {
        'user': request.user,
        'full_access': True,
        'can_manage_users': True,
        'can_edit_utilities': True,
        'dashboard_title': 'Admin Dashboard'
    }
    return render(request, 'dashboard/admin_dashboard.html', context)

@login_required
def operator_dashboard(request):
    if request.user.role not in ['admin', 'operator']:
        return HttpResponseForbidden("You don't have permission to access this page")
    
    # Limited access - can edit utilities but not manage users
    context = {
        'user': request.user,
        'full_access': False,
        'can_manage_users': False,
        'can_edit_utilities': True,
        'dashboard_title': 'Operator Dashboard'
    }
    return render(request, 'dashboard/operator_dashboard.html', context)

@login_required
def viewer_dashboard(request):
    # Read-only access for all authenticated users
    context = {
        'user': request.user,
        'full_access': False,
        'can_manage_users': False,
        'can_edit_utilities': False,
        'dashboard_title': 'Dashboard'
    }
    return render(request, 'dashboard/viewer_dashboard.html', context)

# API Views with permissions
@api_view(['GET'])
@permission_classes([IsOperatorOrAdmin])
def utility_data_api(request):
    """Only operators and admins can access utility data"""
    data = {
        'gas_consumption': 125,
        'electricity_usage': 890,
        'timestamp': '2024-01-15T10:30:00Z'
    }
    return Response(data)

@api_view(['POST'])
@permission_classes([IsOperatorOrAdmin])
def update_utility_data(request):
    """Only operators and admins can update utility data"""
    if request.user.role == 'viewer':
        return Response({'error': 'Permission denied'}, status=403)
    
    # Update logic here
    return Response({'message': 'Data updated successfully'})

@api_view(['GET', 'POST'])
@permission_classes([IsAdmin])
def manage_users(request):
    """Only admins can manage users"""
    if request.method == 'GET':
        users = CustomUser.objects.all()
        # Return user list
        return Response({'users': users})
    else:
        # Create/update user logic
        return Response({'message': 'User management action completed'})
    
@login_required
def user_management_view(request):
    """User management page (Admin only)"""
    if request.user.userprofile.role != 'admin':
        return HttpResponseForbidden("You don't have permission to access this page")
    
    users = User.objects.all().select_related('userprofile')
    context = {
        'users': users
    }
    return render(request, 'users/user_management.html', context)

@login_required
def update_user_role(request, user_id):
    """Update user role (Admin only)"""
    if request.user.userprofile.role != 'admin':
        return JsonResponse({'error': 'Permission denied'}, status=403)
    
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            new_role = data.get('role')
            
            user = User.objects.get(id=user_id)
            user_profile = user.userprofile
            user_profile.role = new_role
            user_profile.save()
            
            return JsonResponse({'success': True, 'message': 'User role updated'})
        except User.DoesNotExist:
            return JsonResponse({'error': 'User not found'}, status=404)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
    
    return JsonResponse({'error': 'Method not allowed'}, status=405)