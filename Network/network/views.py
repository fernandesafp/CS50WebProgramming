from django.contrib.auth import authenticate, login, logout
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseRedirect
from django.shortcuts import render
from django.urls import reverse

from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
import json
from django.views.decorators.csrf import csrf_exempt
from .models import User, Post, UserFollowing, Likes
from django.core.paginator import Paginator


def index(request):
    return render(request, "network/index.html")

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
            return render(request, "network/login.html", {
                "message": "Invalid username and/or password."
            })
    else:
        return render(request, "network/login.html")

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
            return render(request, "network/register.html", {
                "message": "Passwords must match."
            })

        # Attempt to create new user
        try:
            user = User.objects.create_user(username, email, password)
            user.save()
        except IntegrityError:
            return render(request, "network/register.html", {
                "message": "Username already taken."
            })
        login(request, user)
        return HttpResponseRedirect(reverse("index"))
    else:
        return render(request, "network/register.html")

@login_required
@csrf_exempt
def new_post(request):
    if request.method == "POST":
        text = json.loads(request.body).get("text")
        if len(text) > 200:
            return JsonResponse({"error": "Post must be 200 characters or less."}, status=400)
        else:
            post = Post(user=request.user, text=text)
            post.save()
            return JsonResponse({"message": "Post published successfully."}, status=201)
    else:
        return JsonResponse({"error": "POST request required."}, status=400)

def view(request, information, page):
    response = {}
    if information == "all":
        posts = Post.objects.all()
    elif information == "following":
        user = User.objects.get(username=request.user)
        posts = Post.objects.filter(user__in=[follower.following for follower in user.followers.all()])
    else:
        user = User.objects.get(username=information)
        response.update({"user": {"followers": len(user.following.all()),
                                  "following": len(user.followers.all()),
                                  "follows": not request.user.is_anonymous and len(user.following.filter(follower=request.user)) == 1,
                                  "mutual": not request.user.is_anonymous and len(user.followers.filter(following=request.user)) == 1}})
        posts = Post.objects.filter(user=user)

    posts = posts.order_by('-timestamp').all()
    paginator = Paginator(posts, 10)
    page_obj = paginator.get_page(page)
    response.update({"posts": [post.serialize() for post in page_obj]})

    response.update({"pagination": {
        "previous": page_obj.has_previous(),
        "next": page_obj.has_next(),
        "current": page_obj.number,
        "last": page_obj.paginator.num_pages,
    }})

    return JsonResponse(response, safe=False)

@login_required
def follow(request, username):
    user = User.objects.get(username=request.user)
    follow = User.objects.get(username=username)
    if len(user.followers.filter(following=follow)):
        UserFollowing.objects.get(follower=user, following=follow).delete()
        return JsonResponse({"message": f"{username} unfollowed successfully"}, safe=False)
    else:
        UserFollowing.objects.create(follower=user, following=follow)
        return JsonResponse({"message": f"{username} followed successfully"}, safe=False)

@login_required
@csrf_exempt
def edit(request):
    if request.method == "POST":
        json_load = json.loads(request.body)
        post_id = json_load.get("id")
        post_text = json_load.get("text")

        post = Post.objects.get(id=post_id)
        if post.user != request.user:
            return JsonResponse({"error": "Only the publisher can edit this post."}, status=400)

        if len(post_text) > 200:
            return JsonResponse({"error": "Post must be 200 characters or less."}, status=400)
        elif len(post_text) == 0:
            post.delete()
            return JsonResponse({"warning": "Post deleted successfully."}, status=201)
        else:
            post.text = post_text
            post.save()
            return JsonResponse({"message": "Post edited successfully."}, status=201)
    else:
        return JsonResponse({"error": "POST request required."}, status=400)

@login_required
@csrf_exempt
def like(request):
    if request.method == "POST":
        json_load = json.loads(request.body)
        post_id = json_load.get("id")

        post = Post.objects.get(id=post_id)
        like = post.liked.filter(liker=request.user)
        if len(like) == 0:
            post.liked.create(liker=request.user)
        else:
            post.liked.filter(liker=request.user).delete()
        post.save()
        return JsonResponse(post.serialize(), status=201)
    else:
        return JsonResponse({"error": "POST request required."}, status=400)