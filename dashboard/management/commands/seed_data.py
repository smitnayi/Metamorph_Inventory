from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from dashboard.models import Powder, ProductionOrder, QCReport, UtilityData, UserProfile
from datetime import date, timedelta

class Command(BaseCommand):
    help = 'Seed the database with sample data'

    def handle(self, *args, **options):
        self.stdout.write("Seeding database with sample data...")
        
        # Create sample powders
        powders = [
            {'name': 'Matte Black TGIC', 'sku': 'P-10245', 'current_stock': 52, 'min_level': 30},
            {'name': 'Gloss White', 'sku': 'P-10246', 'current_stock': 25, 'min_level': 30},
            {'name': 'Metallic Silver', 'sku': 'P-10247', 'current_stock': 15, 'min_level': 20},
            {'name': 'Bronze Texture', 'sku': 'P-10248', 'current_stock': 45, 'min_level': 25},
        ]
        
        for powder_data in powders:
            powder, created = Powder.objects.get_or_create(
                sku=powder_data['sku'],
                defaults=powder_data
            )
            if created:
                self.stdout.write(f"Created powder: {powder.name}")
        
        # Create sample production orders
        try:
            admin_user = User.objects.get(username='admin')
        except User.DoesNotExist:
            self.stdout.write(self.style.ERROR("Admin user not found. Please create a superuser first."))
            return
        
        production_orders = [
            {'order_id': 'P-2341', 'product_name': 'Matte Black TGIC', 'production_line': '2', 'due_date': date.today() + timedelta(days=2), 'status': 'in_progress', 'quantity': 100, 'created_by': admin_user},
            {'order_id': 'P-2342', 'product_name': 'Gloss White', 'production_line': '1', 'due_date': date.today() + timedelta(days=3), 'status': 'pending', 'quantity': 150, 'created_by': admin_user},
        ]
        
        for order_data in production_orders:
            order, created = ProductionOrder.objects.get_or_create(
                order_id=order_data['order_id'],
                defaults=order_data
            )
            if created:
                self.stdout.write(f"Created production order: {order.order_id}")
        
        # Create sample QC reports
        qc_reports = [
            {'report_id': 'QC-2023-0876', 'product_name': 'Matte Black TGIC', 'test_date': date.today(), 'inspector': 'Alex Johnson', 'result': 'passed', 'created_by': admin_user},
            {'report_id': 'QC-2023-0877', 'product_name': 'Gloss White', 'test_date': date.today(), 'inspector': 'Maria Garcia', 'result': 'failed', 'created_by': admin_user},
        ]
        
        for report_data in qc_reports:
            report, created = QCReport.objects.get_or_create(
                report_id=report_data['report_id'],
                defaults=report_data
            )
            if created:
                self.stdout.write(f"Created QC report: {report.report_id}")
        
        # Create utility data for today
        today = date.today()
        utility_data, created = UtilityData.objects.get_or_create(
            date=today,
            defaults={'gas_consumption': 245, 'electricity_usage': 1847, 'water_usage': 320}
        )
        
        if created:
            self.stdout.write(f"Created utility data for {today}")
        
        # Ensure admin has admin role
        try:
            admin_profile = admin_user.userprofile
            admin_profile.role = 'admin'
            admin_profile.save()
            self.stdout.write("Set admin user role to 'admin'")
        except UserProfile.DoesNotExist:
            UserProfile.objects.create(user=admin_user, role='admin')
            self.stdout.write("Created admin profile with role 'admin'")
        
        self.stdout.write(self.style.SUCCESS('Successfully seeded database with sample data!'))