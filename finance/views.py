from django.contrib.auth import authenticate, login, logout
from django.db import IntegrityError
from django.http import HttpResponseRedirect
from django.shortcuts import render
from django.urls import reverse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
import json
from .models import User, Contact, CarMake, CarModel, Vehicle, Transaction, Task

from bs4 import BeautifulSoup
import requests

def get_google_img(query):
    url = "https://www.google.com/search?q=" + str(query) + "&source=lnms&tbm=isch"
    headers={'User-Agent':"Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/43.0.2357.134 Safari/537.36"}

    html = requests.get(url, headers=headers).text

    soup = BeautifulSoup(html, 'html.parser')
    image = soup.find("img",{"class":"t0fcAb"})

    if not image:
        return "https://www.nemademotors.com/assets/images/carnotfound.jpg"
    return image['src']

def index(request):
    if request.user.is_authenticated:
        return render(request, "finance/index.html", {"user": request.user})
    else:
        return HttpResponseRedirect(reverse("signin"))

def login_view(request):
    if request.method == "POST":

        # Attempt to sign user in
        username = request.POST.get("username")
        password = request.POST.get("password")
        user = authenticate(request, username=username, password=password)

        # Check if authentication successful
        if user is not None:
            login(request, user)
            return HttpResponseRedirect(reverse("index"))
        else:
            return render(request, "finance/login.html", {
                "login_message": "Invalid username and/or password."
            })
    elif request.user.is_authenticated:
        return HttpResponseRedirect(reverse("index"))
    else:
        return render(request, "finance/login.html")

def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("index"))

@csrf_exempt
def register(request):
    if request.method == "POST":
        username = request.POST["username"]
        email = request.POST["email"]
        first_name = request.POST["first_name"]
        last_name = request.POST["last_name"]

        # Ensure password matches confirmation
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]
        if password != confirmation:
            return render(request, "finance/register.html", {
                "register_message": "Passwords must match."
            })

        # Attempt to create new user
        try:
            user = User.objects.create_user(username, email, password, first_name=first_name, last_name=last_name)
            user.save()
        except IntegrityError:
            return render(request, "finance/login.html", {
                "register_message": "Username already taken."
            })
        except ValueError:
            return render(request, "finance/login.html", {
                "register_message": "Please provide a username."
            })
        login(request, user)
        return HttpResponseRedirect(reverse("index"))
    else:
        return render(request, "finance/login.html")

@login_required
def edit_user(request, type):
    if request.method == "POST":
        try:
            if type == "details":
                user = User.objects.get(username=request.user.username)
                body = json.loads(request.body)
                first_name = body.get("first_name")
                last_name = body.get("last_name")
                email = body.get("email")
                user.first_name = first_name
                user.last_name = last_name
                user.email = email
                user.save()
                return JsonResponse({"message": "Details updated successfully."}, status=200)
            elif type == "password":
                user = User.objects.get(username=request.user.username)
                body = json.loads(request.body)
                new_password = body.get("new_password")
                new_confirmation = body.get("new_confirmation")
                if new_password and new_confirmation:
                    if new_password == new_confirmation:
                        password = body.get("password")
                        if user.check_password(password):
                            user.set_password(new_password)
                            user.save()
                            login(request, user)
                            return JsonResponse({"message": "Password updated successfully."}, status=200)
                        else:
                            return JsonResponse({"error": "Password is incorrect."}, status=400)
                    else:
                        return JsonResponse({"error": "New and confirm password are not the same."}, status=400)
                else:
                    return JsonResponse({"error": "Please input the new password."}, status=400)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)
    else:
        return JsonResponse({"error": "POST request required."}, status=400)

@login_required
def new_contact(request):
    if request.method == "POST":
        try:
            user = User.objects.get(username=request.user.username)
            body = json.loads(request.body)
            name = body.get("name")
            phone = body.get("phone")
            email = body.get("email")
            address = body.get("address")
            if name.replace(" ", ""):
                if len(Contact.objects.filter(name=name)):
                    return JsonResponse({"error": "Contact name already exists."}, status=400)
                else:
                    Contact.objects.create(user=user, name=name, phone=phone, email=email, address=address)
                    return JsonResponse({"message": "Contact created successfully."}, status=200)
            else:
                return JsonResponse({"error": "A contact name is required."}, status=400)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)
    else:
        return JsonResponse({"error": "POST request required."}, status=400)

@login_required
def new_task(request):
    if request.method == "POST":
        try:
            user = User.objects.get(username=request.user.username)
            body = json.loads(request.body)
            task = body.get("task")
            if not task.replace(" ", ""):
                return JsonResponse({"error": "Please input a task."}, status=400)

            # Only accepts existing vehicles
            vehicle_id = body.get("vehicle").split(" | ")[0]
            if vehicle_id.replace(" ", "") and (not vehicle_id.isdigit() or not len(Vehicle.objects.filter(id=vehicle_id))):
                return JsonResponse({"error": "Please input only valid vehicles"}, status=400)

            # Creates contact if it does not exist
            contact_name = body.get("contact")
            if contact_name.replace(" ", "") and not len(Contact.objects.filter(user=user, name=contact_name)):
                Contact.objects.create(user=user, name=contact_name)

            # Create task depending on if it is associated with a contact or vehicle
            if vehicle_id.replace(" ", "") and contact_name.replace(" ", ""):
                vehicle = Vehicle.objects.get(id=vehicle_id)
                contact = Contact.objects.get(name=contact_name)
                Task.objects.create(user=user, description=task, contact=contact, vehicle=vehicle)
            elif vehicle_id.replace(" ", ""):
                vehicle = Vehicle.objects.get(id=vehicle_id)
                Task.objects.create(user=user, description=task, vehicle=vehicle)
            elif contact_name.replace(" ", ""):
                contact = Contact.objects.get(name=contact_name)
                Task.objects.create(user=user, description=task, contact=contact)
            else:
                Task.objects.create(user=user, description=task)
            return JsonResponse({"message": "Task created successfully."}, status=200)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)
    else:
        return JsonResponse({"error": "POST request required."}, status=400)

@login_required
def new_transaction(request):
    if request.method == "POST":
        try:
            user = User.objects.get(username=request.user.username)
            body = json.loads(request.body)
            transaction_type = body.get("type")
            if not transaction_type:
                return JsonResponse({"error": "Please input a transaction type."}, status=400)

            value = body.get("value")
            if not value:
                return JsonResponse({"error": "Please input a value."}, status=400)

            contact_name = body.get("contact")
            if not contact_name.replace(" ", ""):
                return JsonResponse({"error": "Please input a contact."}, status=400)

            # Only accepts existing vehicles
            vehicle_id = body.get("vehicle").split(" | ")[0]
            if vehicle_id.replace(" ", "") and (not vehicle_id.isdigit() or not len(Vehicle.objects.filter(id=vehicle_id))):
                return JsonResponse({"error": "Please input only valid vehicles"}, status=400)
            if transaction_type == "SEL" and not vehicle_id.replace(" ", ""):
                return JsonResponse({"error": "Please input a sold vehicle"}, status=400)

            # Creates contact if it does not exist
            if not len(Contact.objects.filter(user=user, name=contact_name)):
                Contact.objects.create(user=user, name=contact_name)
            contact = Contact.objects.get(name=contact_name)

            description = body.get("description")

            # Create transaction depending on if it is associated with a vehicle
            if vehicle_id.replace(" ", ""):
                vehicle = Vehicle.objects.get(id=vehicle_id)
                Transaction.objects.create(user=user, transaction_type=transaction_type, value=value, description=description, contact=contact, vehicle=vehicle)
            else:
                Transaction.objects.create(user=user, transaction_type=transaction_type, value=value, description=description, contact=contact)
            return JsonResponse({"message": "Transaction created successfully."}, status=200)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)
    else:
        return JsonResponse({"error": "POST request required."}, status=400)

@login_required
def new_vehicle(request):
    if request.method == "POST":
        try:
            user = User.objects.get(username=request.user.username)
            body = json.loads(request.body)
            brand_name = body.get("brand")
            contact_name = body.get("contact")
            cost = body.get("cost")

            # Checking if fields are correct
            if not brand_name.replace(" ", ""):
                return JsonResponse({"error": "A brand name is required."}, status=400)
            elif not contact_name.replace(" ", ""):
                return JsonResponse({"error": "A contact name is required."}, status=400)
            elif not cost:
                return JsonResponse({"error": "A cost is required."}, status=400)

            # Creates car make if it does not exist
            if not len(CarMake.objects.filter(brand=brand_name)):
                CarMake.objects.create(brand=brand_name)
            brand = CarMake.objects.get(brand=brand_name)

            # Creates car model if it does not exist
            model_name = body.get("model")
            if model_name.replace(" ", "") and not len(CarModel.objects.filter(brand=brand, model=model_name)):
                CarModel.objects.create(brand=brand, model=model_name)

            # Creates a contact if it does not exist
            if not len(Contact.objects.filter(user=user, name=contact_name)):
                Contact.objects.create(user=user, name=contact_name)
            contact = Contact.objects.get(user=user, name=contact_name)

            # Obtains the remaining of the information
            mileage = body.get("mileage")
            if not mileage:
                mileage = 0
            year = body.get("year")
            if not year:
                year = 1900
            plate = body.get("plate")
            value = body.get("value")
            if not value or value == 0:
                value = cost
            note = body.get("note")

            image = get_google_img(f"car {brand} {model_name} {year}")
            # Creates a new vehicle
            if model_name.replace(" ", ""):
                model = CarModel.objects.filter(brand=brand, model=model_name)
                vehicle = Vehicle.objects.create(user=user, make=brand, model=model.first(),
                                                mileage=mileage, year=year, plate=plate,
                                                cost=cost, value=value, note=note, image=image)
            else:
                vehicle = Vehicle.objects.create(user=user, make=brand,
                                                mileage=mileage, year=year, plate=plate,
                                                cost=cost, value=value, note=note, image=image)

            # Creates a new transaction
            Transaction.objects.create(user=user, transaction_type="PUR",
            value=cost, description=f"Purchase of vehicle", contact=contact, vehicle=vehicle)

            return JsonResponse({"message": "Vehicle created successfully."}, status=200)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)
    else:
        return JsonResponse({"error": "POST request required."}, status=400)

@login_required
def load_database(request, view):
    if request.method == "POST":
        try:
            response = {}
            contacts = Contact.objects.filter(user=request.user).order_by("name").all()
            response.update({"contacts": [contact.serialize() for contact in contacts]})

            # The separation is done in case there's a make with no model associated
            makes = CarMake.objects.order_by("brand").all()
            response.update({"makes": [make.serialize() for make in makes]})
            models = CarModel.objects.order_by("model").all()
            response.update({"models": [model.serialize() for model in models]})

            vehicles = Vehicle.objects.filter(user=request.user).all()
            response.update({"garage": [vehicle.serialize() for vehicle in vehicles]})

            tasks = Task.objects.filter(user=request.user).order_by("timestamp").all()
            response.update({"tasks": [task.serialize() for task in tasks]})

            transactions = Transaction.objects.filter(user=request.user).order_by("-timestamp").all()
            response.update({"transactions": [transaction.serialize() for transaction in transactions]})

            stats = {}
            status = {}
            for transaction in transactions:
                trans_dict = transaction.serialize()
                if trans_dict["vehicle"]:
                    sold = False
                    vehicle_id = trans_dict["vehicle"].split(" | ")[0]
                    if trans_dict["transaction_type"] == "Expense":
                        if vehicle_id in stats:
                            stats[vehicle_id] = stats[vehicle_id] + trans_dict["value"]
                        else:
                            stats[vehicle_id] = trans_dict["value"]
                    elif trans_dict["transaction_type"] == "Selling":
                            sold = trans_dict["value"]
                    if sold:
                        status[vehicle_id] = sold
                response.update({"stats": stats, "sold": status})

            return JsonResponse(response, safe=False)
        except Exception as e:
            print(str(e))
            return JsonResponse({"error": str(e)}, status=400)
    else:
        return JsonResponse({"error": "POST request required."}, status=400)

@login_required
def new_update(request):
    if request.method == "POST":
        try:
            user = User.objects.get(username=request.user.username)
            body = json.loads(request.body)
            element_id = body.get("id")
            element_type = body.get("type")
            if element_type == "contact":
                Contact.objects.get(user=user, id=element_id).delete()
            elif element_type == "task":
                remove = body.get("remove")
                if remove:
                    Task.objects.get(user=user, id=element_id).delete()
                else:
                    task = Task.objects.get(user=user, id=element_id)
                    task.completed = True
                    task.save()
                    print("hshds")
            return JsonResponse({"message": "Success."}, status=200)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)
    else:
        return JsonResponse({"error": "POST request required."}, status=400)