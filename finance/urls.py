from django.urls import path
from . import views

urlpatterns = [
    path("", views.index, name="index"),

    path("login", views.login_view, name="signin"),
    path("register", views.register, name="register"),
    path("logout", views.logout_view, name="signout"),

    path("edit/<str:type>", views.edit_user, name="edit"),
    path("new/vehicle", views.new_vehicle, name="new_vehicle"),
    path("new/transaction", views.new_transaction, name="new_transaction"),
    path("new/task", views.new_task, name="new_tast"),
    path("new/contact", views.new_contact, name="new_contact"),
    path("new/update", views.new_update, name="new_update"),
    path("load/<str:view>", views.load_database, name="load_database"),
]