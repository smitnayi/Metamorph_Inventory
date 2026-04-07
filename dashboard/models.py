from datetime import date
from django.db import models
from django.conf import settings


class Powder(models.Model):
    name = models.CharField(max_length=100)
    sku = models.CharField(max_length=50, unique=True)
    color = models.CharField(max_length=20, default='#E8771A')
    current_stock = models.FloatField(default=0)
    min_level = models.FloatField(default=0)
    location = models.CharField(max_length=100, blank=True, default='')
    price_per_kg = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.sku})"

    @property
    def status(self):
        if self.current_stock <= self.min_level:
            return 'Critical'
        elif self.current_stock <= self.min_level * 1.5:
            return 'Low Stock'
        return 'In Stock'


class Task(models.Model):
    STATUS_CHOICES = (
        ('todo', 'To Do'),
        ('in_progress', 'In Progress'),
        ('review', 'Review'),
        ('done', 'Done'),
    )
    PRIORITY_CHOICES = (
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
    )

    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, default='')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='todo')
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='medium')
    assignee = models.CharField(max_length=100, blank=True, default='')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title


class QCReport(models.Model):
    RESULT_CHOICES = (
        ('Pass', 'Pass'),
        ('Fail', 'Fail'),
    )

    batch_id = models.CharField(max_length=50)
    powder_type = models.CharField(max_length=100, default='')
    inspector = models.CharField(max_length=100, default='')
    date = models.DateField(default=date.today)
    thickness = models.CharField(max_length=50, blank=True, default='')
    adhesion = models.CharField(max_length=20, blank=True, default='5B')
    visual = models.CharField(max_length=50, blank=True, default='OK')
    notes = models.TextField(blank=True, default='')
    result = models.CharField(max_length=10, choices=RESULT_CHOICES, default='Pass')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"QC {self.batch_id} - {self.result}"


class GasRecord(models.Model):
    type = models.CharField(max_length=50, default='Argon')
    capacity = models.FloatField(default=0)
    current_level = models.FloatField(default=0)
    refill_date = models.DateField(null=True, blank=True)
    cost = models.FloatField(default=0)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.type} - {self.current_level}/{self.capacity}"
