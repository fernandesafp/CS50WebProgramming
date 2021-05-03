from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone

class User(AbstractUser):
    pass

class Category(models.Model):
    category = models.CharField(max_length=32)

    def __str__(self):
        return f"{self.category}"

class Listing(models.Model):
    seller = models.ForeignKey(User, on_delete=models.PROTECT)
    title = models.CharField(max_length=64)
    description = models.CharField(null=True, max_length=200)
    date = models.DateTimeField(default=timezone.now)
    starting_bid = models.DecimalField(max_digits=9, decimal_places=2)
    current_bid = models.DecimalField(null=True, max_digits=9, decimal_places=2)
    image = models.CharField(max_length=1028)
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name="categories", null=True)
    active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.id} - {self.title} - {self.seller} - ${self.starting_bid}"

class Watcher(models.Model):
    watcher = models.ForeignKey(User, on_delete=models.CASCADE, related_name="watcher")
    watching = models.ManyToManyField(Listing, blank=True, related_name="watching")

    def __str__(self):
        return f"{self.watcher}"

class Bids(models.Model):
    listing = models.ForeignKey(Listing, on_delete=models.CASCADE)
    bidder = models.ForeignKey(User, on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=9, decimal_places=2)
    time = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.listing.title} - {self.bidder} - {self.amount}"

class Comments(models.Model):
    listing = models.ForeignKey(Listing, on_delete=models.CASCADE, related_name="comments")
    commenter = models.ForeignKey(User, on_delete=models.CASCADE) 
    comment = models.CharField(max_length=200)
    time = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.listing.title} - {self.commenter} - {self.comment}"