from django.db import models
from django.contrib.auth.models import User

# Create your models here.
class UserProfile(models.Model):
    ROLE_CHOICES = [
        ('admin', 'Administrator'),
        ('manager', 'Production Manager'),
        ('operator', 'Machine Operator'),
        ('qc', 'Quality Control'),
        ('viewer', 'Viewer'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='operator')
    department = models.CharField(max_length=100, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    
    def __str__(self):
        return f"{self.user.username} - {self.role}"

class Powder(models.Model):
    name = models.CharField(max_length=100)
    sku = models.CharField(max_length=50, unique=True)
    current_stock = models.IntegerField(default=0)
    min_level = models.IntegerField(default=0)
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

class ProductionOrder(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    
    order_id = models.CharField(max_length=20, unique=True)
    product_name = models.CharField(max_length=100)
    production_line = models.CharField(max_length=10, choices=[('1', 'Line 1'), ('2', 'Line 2'), ('3', 'Line 3')])
    due_date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    quantity = models.IntegerField(default=0)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.order_id} - {self.product_name}"

class QCReport(models.Model):
    RESULT_CHOICES = [
        ('passed', 'Passed'),
        ('failed', 'Failed'),
        ('pending', 'Pending'),
    ]
    
    report_id = models.CharField(max_length=20, unique=True)
    product_name = models.CharField(max_length=100)
    test_date = models.DateField()
    inspector = models.CharField(max_length=100)
    result = models.CharField(max_length=20, choices=RESULT_CHOICES)
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.report_id} - {self.product_name}"

class UtilityData(models.Model):
    date = models.DateField()
    gas_consumption = models.IntegerField(default=0)  # m³
    electricity_usage = models.IntegerField(default=0)  # kWh
    water_usage = models.IntegerField(default=0)  # m³
    created_at = models.DateTimeField(auto_now_add=True)
    
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