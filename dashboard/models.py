from datetime import date
from django.db import models
from django.contrib.auth.models import User
from django.conf import settings


class Powder(models.Model):
    name = models.CharField(max_length=100)
    sku = models.CharField(max_length=50, unique=True)
    current_stock = models.IntegerField(default=0)
    min_level = models.IntegerField(default=0)
    price_per_kg = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.name} ({self.sku})"
    
    @property
    def status(self):
        if self.current_stock <= self.min_level:
            return 'Critical'
        elif self.current_stock <= self.min_level * 1.2:
            return 'Low Stock'
        else:
            return 'In Stock'

class UserProfile(models.Model):
    ROLE_CHOICES = (
        ('admin', 'Admin'),
        ('operator', 'Operator'),
        ('viewer', 'Viewer'),
    )
    
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='viewer')
    department = models.CharField(max_length=100, blank=True, null=True)
    phone = models.CharField(max_length=15, blank=True, null=True)
    
    def __str__(self):
        return f"{self.user.username} ({self.role})"

class UtilityConsumption(models.Model):
    gas_consumption = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    electricity_usage = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-timestamp']
    
    def __str__(self):
        return f"Gas: {self.gas_consumption}, Electricity: {self.electricity_usage}"

class ProductionOrder(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    )
    
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    order_id = models.CharField(max_length=50, unique=True, default="")
    order_number = models.CharField(max_length=50, default="TEMP_ORDER")
    product_name = models.CharField(max_length=100, default="TEMP_PRODUCT")
    production_line = models.CharField(max_length=20, default="1")
    due_date = models.DateField(default=date.today)
    quantity = models.IntegerField(default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Utility fields
    electricity_used = models.FloatField(default=0)
    gas_used = models.FloatField(default=0)
    water_used = models.FloatField(default=0)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.order_id} - {self.product_name}"

class QCReport(models.Model):
    RESULT_CHOICES = (
        ('passed', 'Passed'),
        ('failed', 'Failed'),
        ('pending', 'Pending'),
    )
    
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    report_id = models.CharField(max_length=50, unique=True, default="")
    product_name = models.CharField(max_length=100, default="")
    test_date = models.DateField(default=date.today)
    inspector = models.CharField(max_length=100, default="")
    result = models.CharField(max_length=20, choices=RESULT_CHOICES, default='pending')
    notes = models.TextField(blank=True)
    
    # Make production_order optional
    production_order = models.ForeignKey(ProductionOrder, on_delete=models.CASCADE, null=True, blank=True)
    
    passed_tests = models.IntegerField(default=0)
    failed_tests = models.IntegerField(default=0)
    pass_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0.0)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"QC Report {self.report_id} - {self.product_name}"
    
class UtilityData(models.Model):
    date = models.DateField()
    gas_consumption = models.FloatField(default=0)  # m³
    electricity_usage = models.FloatField(default=0)  # kWh
    water_usage = models.FloatField(default=0)  # m³
    powder_consumption = models.FloatField(default=0)  # kg
    powder_type = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    # Add unique constraint to prevent duplicates for the same date
    class Meta:
        unique_together = ['date']
    
    def __str__(self):
        return f"Utilities - {self.date}"

class ProductionLog(models.Model):
    date = models.DateField(auto_now_add=True)
    product_name = models.CharField(max_length=100)
    quantity = models.IntegerField()
    operator_name = models.CharField(max_length=50)

    def __str__(self):
        return f"{self.product_name} - {self.quantity}"
    
    
