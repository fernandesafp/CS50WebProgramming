from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    pass

class Contact(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    name = models.CharField(max_length=64, unique=True)
    phone = models.CharField(max_length=16, null=True)
    email = models.CharField(max_length=64, null=True)
    address = models.CharField(max_length=256, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    def serialize(self):
        return {
            "id": self.id,
            "name": self.name,
            "phone": self.phone,
            "email": self.email,
            "address": self.address,
            "timestamp": self.timestamp.strftime("%b %d %Y, %I:%M %p")
        }

    def __str__(self):
        return f"{self.user.username} | {self.name}"

class CarMake(models.Model):
    brand = models.CharField(max_length=32, unique=True)

    def serialize(self):
        return {
            "id": self.id,
            "brand": self.brand
        }

    def __str__(self):
        return f"{self.brand}"

class CarModel(models.Model):
    brand = models.ForeignKey(CarMake, on_delete=models.CASCADE, related_name="make")
    model = models.CharField(max_length=64, blank=True)

    def serialize(self):
        return {
            "id": self.id,
            "brand": self.brand.brand,
            "model": self.model
        }

    def __str__(self):
        return f"{self.brand} {self.model}"

class Vehicle(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    make = models.ForeignKey(CarMake, on_delete=models.DO_NOTHING)
    model = models.ForeignKey(CarModel, on_delete=models.DO_NOTHING, blank=True, null=True)
    mileage = models.FloatField(blank=True)
    year = models.IntegerField(blank=True)
    plate = models.CharField(max_length=16, blank=True)
    cost = models.FloatField()
    value = models.FloatField()
    note = models.CharField(max_length=200, blank=True)
    image = models.CharField(max_length=1024)
    timestamp = models.DateTimeField(auto_now_add=True)

    def serialize(self):
        if self.model is None:
            model = ""
        else:
            model = self.model.model
        return {
            "id": self.id,
            "make": self.make.brand,
            "model": model,
            "mileage": self.mileage,
            "year": self.year,
            "plate": self.plate,
            "cost": self.cost,
            "value": self.value,
            "note": self.note,
            "image": self.image,
            "timestamp": self.timestamp.strftime('%d-%m-%Y')
        }

    def __str__(self):
        if self.model is None:
            return f"{self.user.username} | {self.make} {self.year}"
        else:
            return f"{self.user.username} | {self.make} {self.model.model} {self.year}"

class Transaction(models.Model):
    TRANSACTION_TYPE = (
        ("PUR", "Purchase"),
        ("SEL", "Selling"),
        ("SER", "Service"),
        ("EXP", "Expense"),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    transaction_type = models.CharField(max_length=16, choices=TRANSACTION_TYPE)
    value = models.FloatField()
    description = models.CharField(max_length=200, blank=True)
    contact = models.ForeignKey(Contact, on_delete=models.DO_NOTHING, blank=True)
    vehicle = models.ForeignKey(Vehicle, on_delete=models.DO_NOTHING, blank=True, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    def serialize(self):
        if self.description is None:
            description = ""
        else:
            description = self.description
        if self.contact is None:
            contact = ""
        else:
            contact = self.contact.name
        if self.vehicle is None:
            vehicle = ""
        else:
            if self.vehicle.model is None:
                vehicle = f"{self.vehicle.id} | {self.vehicle.make} {self.vehicle.year}"
            else:
                vehicle = f"{self.vehicle.id} | {self.vehicle.make} {self.vehicle.model.model} {self.vehicle.year}"
        return {
            "id": self.id,
            "transaction_type": self.get_transaction_type_display(),
            "value": self.value,
            "description": description,
            "contact": contact,
            "vehicle": vehicle,
            "timestamp": self.timestamp.strftime('%H:%M %d-%m-%Y'),
        }


    def __str__(self):
        return f"{self.user} | {self.transaction_type} {self.contact.name} | {self.value} €"

class Task(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    description = models.CharField(max_length=200, default="")
    contact = models.ForeignKey(Contact, on_delete=models.DO_NOTHING, null=True)
    vehicle = models.ForeignKey(Vehicle, on_delete=models.DO_NOTHING, null=True)
    completed = models.BooleanField(default=False)
    timestamp = models.DateTimeField(auto_now_add=True)

    def serialize(self):
        if self.contact is None:
            contact = ""
        else:
            contact = self.contact.name
        if self.vehicle is None:
            vehicle = ""
        else:
            if self.vehicle.model is None:
                vehicle = f"{self.vehicle.id} | {self.vehicle.make} {self.vehicle.year}"
            else:
                vehicle = f"{self.vehicle.id} | {self.vehicle.make} {self.vehicle.model.model} {self.vehicle.year}"
        return {
            "id": self.id,
            "description": self.description,
            "contact": contact,
            "vehicle": vehicle,
            "completed": self.completed,
            "timestamp": self.timestamp.strftime('%H:%M %d-%m-%Y'),
        }

    def __str__(self):
        return f"{self.user.username} | {self.description} | Completed: {self.completed}"