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
        read_only_fields = ('created_by',)

class QCReportSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)
    
    class Meta:
        model = QCReport
        fields = '__all__'
        read_only_fields = ('created_by',)

class UtilityDataSerializer(serializers.ModelSerializer):
    class Meta:
        model = UtilityData
        fields = '__all__'

class ProductionLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductionLog
        fields = '__all__'

# New serializers for utilities analytics
class UtilitiesAnalyticsSerializer(serializers.Serializer):
    date = serializers.DateField()
    total_electricity = serializers.FloatField()
    total_gas = serializers.FloatField()
    total_water = serializers.FloatField()
    total_orders = serializers.IntegerField()
    efficiency = serializers.FloatField()


from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password  
User = get_user_model()

class CustomUserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'password2', 'first_name', 'last_name', 'role')
        extra_kwargs = {
            'first_name': {'required': False},
            'last_name': {'required': False},
            'role': {'required': False}
        }

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        user = User.objects.create_user(**validated_data)
        return user