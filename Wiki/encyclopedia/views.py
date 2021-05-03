from django.shortcuts import render
from random import choice
from django.http import HttpResponseRedirect
from . import util
from markdown2 import Markdown

def get_error(error_type, title, entries = []):
    if error_type == "unknown":
        error = f'Page "{title}" does not exist!'
        error_message = "Sorry! The page you were looking for does not exist."
        if len(entries) > 0:
            error_message = error_message + " Did you mean..."
    elif error_type == "exists":
        error = f'"{title}" already exists!'
        error_message = "Could not create a new page. The title already exists!"
    return error, error_message

def index(request):
    return render(request, "encyclopedia/index.html", {
        "entries": util.list_entries()
    })

def view_page(request, title):
    entries = util.list_entries()
    for entry in entries:
        if title.lower() == entry.lower():
            content = util.get_entry(entry)
            markdown = Markdown()
            content = markdown.convert(content)
            content_dict = {"title": entry, "content": content}
            return render(request, "encyclopedia/title.html", content_dict)
    error, error_message = get_error("unknown", title)
    return render(request, "encyclopedia/error.html", {"error": error, "error_message": error_message})

def search_page(request):
    title = request.GET.get("q", "")
    entries = util.list_entries()
    possible_entries = []
    for entry in entries:
        if title.lower() == entry.lower():
            return HttpResponseRedirect(f"/wiki/{entry}")
        elif entry.lower().startswith(title.lower()):
            possible_entries.append(entry)
    error, error_message = get_error("unknown", title, possible_entries)
    return render(request, "encyclopedia/error.html", {"title": title, "entries": possible_entries, "error": error, "error_message": error_message})

def new_page(request):
    return render(request, "encyclopedia/new.html")

def save_page(request):
    title = request.GET.get("edit_title", "")
    if not title:
        title = request.GET.get("new_title", "")
        entries = util.list_entries()
        for entry in entries:
            if title.lower() == entry.lower():
                error, error_message = get_error("exists", entry)
                return render(request, "encyclopedia/error.html", {"error": error, "entries": [entry], "error_message": error_message})
    content = request.GET.get("content", "")
    util.save_entry(title, content)
    return HttpResponseRedirect(f"/wiki/{title}")

def edit_page(request, title):
    return render(request, "encyclopedia/new.html", {"title": title, "content": util.get_entry(title)})

def random_page(request):
    entries = util.list_entries()
    title = choice(entries)
    return HttpResponseRedirect(f"/wiki/{title}")