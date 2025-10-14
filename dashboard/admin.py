from django.contrib import admin
from .models import UserProfile

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'role', 'department', 'phone']
    list_filter = ['role', 'department']
    search_fields = ['user__username', 'user__email', 'department']

# Also register your other models
from .models import Powder, ProductionOrder, QCReport, UtilityData

admin.site.register(Powder)
admin.site.register(ProductionOrder)
admin.site.register(QCReport)
admin.site.register(UtilityData)