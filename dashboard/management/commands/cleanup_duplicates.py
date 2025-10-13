# dashboard/management/commands/cleanup_duplicates.py
from django.core.management.base import BaseCommand
from dashboard.models import UtilityData
from django.db.models import Count
from datetime import date

class Command(BaseCommand):
    help = 'Clean up duplicate UtilityData entries'

    def handle(self, *args, **options):
        # Find duplicate dates
        duplicates = UtilityData.objects.values('date').annotate(count=Count('id')).filter(count__gt=1)
        
        self.stdout.write(f"Found {len(duplicates)} dates with duplicates")
        
        for dup in duplicates:
            dup_date = dup['date']
            # Get all records for this date, ordered by creation date (newest first)
            records = UtilityData.objects.filter(date=dup_date).order_by('-created_at')
            
            self.stdout.write(f"Cleaning up {dup['count']} duplicates for {dup_date}")
            
            # Keep the most recent record, delete others
            for record in records[1:]:
                record.delete()
                self.stdout.write(f"Deleted duplicate record for {dup_date}")
        
        self.stdout.write(self.style.SUCCESS('Successfully cleaned up duplicates'))