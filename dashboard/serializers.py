from rest_framework import serializers
from django.contrib.auth.models import User
from .models import ProductionLog, UserProfile, Powder, ProductionOrder, QCReport, UtilityData

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ('role', 'department', 'phone')

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    profile = UserProfileSerializer(read_only=True)
    
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password', 'first_name', 'last_name', 'profile')
    
    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )
        return user

class PowderSerializer(serializers.ModelSerializer):
    status = serializers.ReadOnlyField()
    
    class Meta:
        model = Powder
        fields = '__all__'

class ProductionOrderSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)
    
    class Meta:
        model = ProductionOrder
        fields = '__all__'

class QCReportSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)
    
    class Meta:
        model = QCReport
        fields = '__all__'

class UtilityDataSerializer(serializers.ModelSerializer):
    class Meta:
        model = UtilityData
        fields = '__all__'

class ProductionLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductionLog
        fields = '__all__'