from django.contrib import admin
from .models import Listing, Category, Watcher, Bids, Comments

# Register your models here.
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("category")

class WatcherAdmin(admin.ModelAdmin):
    filter_horizontal = ("watching",)

admin.site.register(Category)
admin.site.register(Listing)
admin.site.register(Watcher, WatcherAdmin)
admin.site.register(Bids)
admin.site.register(Comments)