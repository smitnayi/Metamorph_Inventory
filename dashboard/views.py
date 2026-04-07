from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.db.models import Sum
from django.contrib.auth import get_user_model

from .models import Powder, Task, QCReport, GasRecord
from .serializers import (
    PowderSerializer, TaskSerializer, QCReportSerializer,
    GasRecordSerializer, RegisterSerializer, UserSerializer
)

User = get_user_model()


# ═══════════════════════════════════════
#  ViewSets — Full CRUD via REST Router
# ═══════════════════════════════════════

class PowderViewSet(viewsets.ModelViewSet):
    queryset = Powder.objects.all().order_by('-updated_at')
    serializer_class = PowderSerializer
    permission_classes = [IsAuthenticated]


class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class QCReportViewSet(viewsets.ModelViewSet):
    queryset = QCReport.objects.all()
    serializer_class = QCReportSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class GasRecordViewSet(viewsets.ModelViewSet):
    queryset = GasRecord.objects.all()
    serializer_class = GasRecordSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


# ═══════════════════════════════════════
#  Custom API Endpoints
# ═══════════════════════════════════════

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me(request):
    """Return the current authenticated user's info."""
    serializer = UserSerializer(request.user)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    """Register a new user account."""
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        return Response(
            UserSerializer(user).data,
            status=status.HTTP_201_CREATED
        )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_summary(request):
    """Return KPI summary data for the dashboard."""
    powders = Powder.objects.all()
    tasks = Task.objects.all()
    qc_reports = QCReport.objects.all()
    gas_records = GasRecord.objects.all()

    total_stock = powders.aggregate(total=Sum('current_stock'))['total'] or 0
    total_tasks = tasks.count()
    tasks_done = tasks.filter(status='done').count()

    total_qc = qc_reports.count()
    passed_qc = qc_reports.filter(result='Pass').count()
    pass_rate = (passed_qc / total_qc * 100) if total_qc > 0 else 0

    total_gas = gas_records.aggregate(total=Sum('current_level'))['total'] or 0

    return Response({
        'totalStock': round(total_stock, 1),
        'totalSKUs': powders.count(),
        'totalTasks': total_tasks,
        'tasksDone': tasks_done,
        'passRate': round(pass_rate, 1),
        'totalInspections': total_qc,
        'totalGas': round(total_gas, 1),
        'totalTanks': gas_records.count(),
    })