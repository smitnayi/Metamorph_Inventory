from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Powder, Task, QCReport, GasRecord

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'role')
        read_only_fields = ('id',)


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'first_name', 'last_name', 'role')
        extra_kwargs = {
            'role': {'required': False},
            'first_name': {'required': False},
            'last_name': {'required': False},
        }

    def create(self, validated_data):
        role = validated_data.pop('role', 'operator')
        user = User.objects.create_user(**validated_data)
        user.role = role
        user.save()
        return user


class PowderSerializer(serializers.ModelSerializer):
    status = serializers.ReadOnlyField()

    class Meta:
        model = Powder
        fields = '__all__'


class TaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = '__all__'
        read_only_fields = ('created_by',)


class QCReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = QCReport
        fields = '__all__'
        read_only_fields = ('created_by',)


class GasRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = GasRecord
        fields = '__all__'
        read_only_fields = ('created_by',)