from django.contrib import admin
from .models import User, CarMake, CarModel, Vehicle, Transaction, Contact, Task

admin.site.register(User)
admin.site.register(CarModel)
admin.site.register(CarMake)
admin.site.register(Vehicle)
admin.site.register(Transaction)
admin.site.register(Contact)
admin.site.register(Task)