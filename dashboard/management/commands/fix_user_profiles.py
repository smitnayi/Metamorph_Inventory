from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from dashboard.models import UserProfile

class Command(BaseCommand):
    help = 'Create UserProfile for existing users'

    def handle(self, *args, **options):
        users_without_profile = User.objects.filter(userprofile__isnull=True)
        count = 0
        
        for user in users_without_profile:
            UserProfile.objects.create(user=user, role='operator')
            count += 1
            self.stdout.write(f"Created UserProfile for {user.username}")
        
        self.stdout.write(self.style.SUCCESS(f'Successfully created {count} UserProfiles'))