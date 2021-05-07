from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    pass

class Post(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    text = models.CharField(max_length=200)
    timestamp = models.DateTimeField(auto_now_add=True)

    def serialize(self):
        return {
            "id": self.id,
            "user": self.user.username,
            "text": self.text,
            "likes": [user.liker.username for user in self.liked.all()],
            "timestamp": self.timestamp.strftime("%b %d %Y, %I:%M %p")
        }

    def __str__(self):
        return f"{self.user.username} - {self.text}"

class Likes(models.Model):
    liker = models.ForeignKey(User, on_delete=models.CASCADE, related_name="liker")
    liked = models.ManyToManyField(Post, blank=True, related_name="liked")
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.liker}"

class UserFollowing(models.Model):
    follower = models.ForeignKey(User, on_delete=models.CASCADE, related_name="followers")
    following = models.ForeignKey(User, on_delete=models.CASCADE, related_name="following")

    def __str__(self):
        return f"{self.follower} follows {self.following}"