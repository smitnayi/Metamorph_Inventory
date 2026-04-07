from django.contrib import admin
from .models import Powder, Task, QCReport, GasRecord

@admin.register(Powder)
class PowderAdmin(admin.ModelAdmin):
    list_display = ('name', 'sku', 'current_stock', 'min_level', 'status')
    search_fields = ('name', 'sku')

@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ('title', 'status', 'priority', 'assignee')
    list_filter = ('status', 'priority')

@admin.register(QCReport)
class QCReportAdmin(admin.ModelAdmin):
    list_display = ('batch_id', 'powder_type', 'inspector', 'date', 'result')
    list_filter = ('result', 'date')

@admin.register(GasRecord)
class GasRecordAdmin(admin.ModelAdmin):
    list_display = ('type', 'current_level', 'capacity', 'refill_date')