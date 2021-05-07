from django.contrib import admin

from .models import User, Post, UserFollowing, Likes

class LikesAdmin(admin.ModelAdmin):
    filter_horizontal = ("liked",)


# Register your models here.
admin.site.register(User)
admin.site.register(Post)
admin.site.register(Likes, LikesAdmin)
admin.site.register(UserFollowing)