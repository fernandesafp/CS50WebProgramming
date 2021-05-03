from django.contrib.auth import authenticate, login, logout
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseRedirect
from django.shortcuts import render
from django.urls import reverse
from django.utils import timezone
from django.contrib.auth.decorators import login_required

from .models import User, Listing, Category, Watcher, Bids, Comments

message = ""

def index(request):
    #This is done to keep updated the bids after a removal by an admin
    for listing in Listing.objects.all():
        bid = Bids.objects.filter(listing=listing)
        if bid.count() > 0:
            listing.current_bid = bid.last().amount
            listing.save()
        else:
            listing.current_bid = listing.starting_bid
            listing.save()

    return render(request, "auctions/index.html", {"listings": Listing.objects.filter(active=True), "title": "Active Listings"})

def login_view(request):
    if request.method == "POST":

        # Attempt to sign user in
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)

        # Check if authentication successful
        if user is not None:
            login(request, user)
            return HttpResponseRedirect(reverse("index"))
        else:
            return render(request, "auctions/login.html", {
                "message": "Invalid username and/or password."
            })
    else:
        return render(request, "auctions/login.html")


def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("index"))


def register(request):
    if request.method == "POST":
        username = request.POST["username"]
        email = request.POST["email"]

        # Ensure password matches confirmation
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]
        if password != confirmation:
            return render(request, "auctions/register.html", {
                "message": "Passwords must match."
            })

        # Attempt to create new user
        try:
            user = User.objects.create_user(username, email, password)
            user.save()
        except IntegrityError:
            return render(request, "auctions/register.html", {
                "message": "Username already taken."
            })
        login(request, user)
        return HttpResponseRedirect(reverse("index"))
    else:
        return render(request, "auctions/register.html")

@login_required
def create(request):
    if request.method == "POST":
        title = request.POST["title"]
        if title:
            description = request.POST["description"]
            try:
                starting_bid = float(request.POST["bid"])
            except:
                starting_bid = 0.00
            image = request.POST["image"]
            try:
                category = Category.objects.get(category=request.POST["category"])
                Listing.objects.create(seller=request.user, title=title, description=description,
                                       date=timezone.now(), starting_bid=starting_bid, current_bid=starting_bid,
                                       image=image, category=category)
            except:
                Listing.objects.create(seller=request.user, title=title, description=description,
                                       date=timezone.now(), starting_bid=starting_bid,
                                       current_bid=starting_bid, image=image)
            return HttpResponseRedirect(reverse("index"))
    return render(request, "auctions/create.html", {"categories": Category.objects.all()})

def listing(request, listing_id):
    global message
    listing = Listing.objects.get(pk=listing_id)
    current_bid = Bids.objects.filter(listing=listing)
    if current_bid.count() == 0:
        current_bid = ""
    else:
        current_bid = current_bid.last()
    if request.user.is_authenticated:
        watchers = listing.watching.filter(watcher=request.user).all()
    else:
        watchers = []
    message_tmp = message
    message = ""
    return render(request, "auctions/listing.html", {"listing": listing,
    "watchers": watchers, "message": message_tmp,
    "bid": current_bid, "comments": listing.comments.order_by('-time').all()})

@login_required
def watch(request, listing_id):
    listing = Listing.objects.get(pk=listing_id)
    if Watcher.objects.filter(watcher=request.user).count() == 0:
        Watcher.objects.create(watcher=request.user)
    watcher = Watcher.objects.get(watcher=request.user)
    if "remove" in request.POST:
        watcher.watching.remove(listing)
    else:
        watcher.watching.add(listing)
    return HttpResponseRedirect(reverse("listing", args=(listing_id,)))

@login_required
def bid(request, listing_id):
    global message
    if request.method == "POST":
        amount = float(request.POST["bid"])
        listing = Listing.objects.get(pk=listing_id)
        bid = Bids.objects.filter(listing=listing)
        if bid.count() == 0:
            if amount >= listing.starting_bid:
                Bids.objects.create(listing=listing, bidder=request.user, amount=amount)
                listing.bid = amount
                listing.save()
            else:
                message = "Please insert an amount equal or greater than the starting bid."
                return HttpResponseRedirect(reverse("listing", args=((listing_id,))))
        else:
            if amount > bid.last().amount:
                bid = Bids.objects.create(listing=listing, bidder=request.user, amount=amount)
            else:
                message = "Please insert an amount greater than the current bid."
                return HttpResponseRedirect(reverse("listing", args=((listing_id,))))
    return HttpResponseRedirect(reverse("listing", args=(listing_id,)))

@login_required
def close(request, listing_id):
    if request.method == "POST":
        listing = Listing.objects.get(pk=listing_id)
        if listing.active:
            listing.active = False
        else:
            listing.active = True
        listing.save()
    return HttpResponseRedirect(reverse("listing", args=(listing_id,)))

@login_required
def comment(request, listing_id):
    if request.method == "POST":
        comment = request.POST["comment"]
        if comment:
            listing = Listing.objects.get(pk=listing_id)
            Comments.objects.create(listing=listing, commenter=request.user, comment=comment)

    return HttpResponseRedirect(reverse("listing", args=(listing_id,)))

@login_required
def watching(request):
    #This is done to keep updated the bids after a removal by an admin
    watching = []
    for listing in Listing.objects.all():
        bid = Bids.objects.filter(listing=listing)
        if bid.count() > 0:
            listing.current_bid = bid.last().amount
            listing.save()
        else:
            listing.current_bid = listing.starting_bid
            listing.save()
        if listing.watching.filter(watcher=request.user).count() > 0:
            watching.append(listing)

    return render(request, "auctions/index.html", {"listings": watching, "title": "Watching"})

def categories(request, category):
    #This is done to keep updated the bids after a removal by an admin
    for listing in Listing.objects.all():
        bid = Bids.objects.filter(listing=listing)
        if bid.count() > 0:
            listing.current_bid = bid.last().amount
            listing.save()
        else:
            listing.current_bid = listing.starting_bid
            listing.save()

    category_id = Category.objects.filter(category=category).first().id
    return render(request, "auctions/index.html", {"listings": Listing.objects.filter(category=category_id, active=True), "title": category})