from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("wiki/<str:title>", views.view_page, name="view_title"),
    path("search", views.search_page, name="search_title"),
    path("new", views.new_page, name="new_page"),
    path("save", views.save_page, name="save_title"),
    path("wiki/<str:title>/edit", views.edit_page, name="edit_page"),
    path("random", views.random_page, name="random_title")
]
