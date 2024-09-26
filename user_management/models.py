# user_management/models.py

from django.contrib.auth.models import AbstractUser
from django.db import models

class CustomUser(AbstractUser):
    email = models.EmailField(unique=True)
    # Add any additional fields you want for your user model

    def __str__(self):
        return self.username