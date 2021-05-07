document.addEventListener('DOMContentLoaded', function() {
    // Buttons to toggle between views
    document.querySelector("#network").addEventListener("click", () => view_posts("all"));
    document.querySelector("#all-posts").addEventListener("click", () => view_posts("all"));
    if (document.querySelector("#user")) {
        document.querySelector("#user").addEventListener("click", () => view_posts(""));
        document.querySelector("#following").addEventListener("click", () => view_posts("following"));
    }

    view_posts("all");
});

function view_posts(view, page=1) {
    if (view === "all") {
        document.querySelector("#profile-view").style.display = "none";
        document.querySelector("#posts-view").innerHTML = "<h3>All Posts</h3><hr>"
        if (document.querySelector("#new-post")) {
            document.querySelector("#message").innerHTML = "";
            document.querySelector("#new-post").style.display = "block";
            document.querySelector("#publish").addEventListener("click", new_post);
        }
    } else if (view === "following") {
        document.querySelector("#new-post").style.display = "none";
        document.querySelector("#profile-view").style.display = "none";
        document.querySelector("#posts-view").innerHTML = "<h3>Following</h3><hr>"
    } else {
        if (document.querySelector("#new-post")) {
            document.querySelector("#new-post").style.display = "none";
        }
        document.querySelector("#posts-view").innerHTML = "<h3>Posts</h3><hr>"
        button = document.querySelector("#follow-button");
        if (view === "" || (document.querySelector("#user") && document.querySelector("#user").innerText == view)) {
            view = document.querySelector("#user").innerText;
            button.style.display = "none";
        } else if (document.querySelector("#user")){
            button.style.display = "block";
        } else {
            button.style.display = "none";
        }
        document.querySelector("#username").innerHTML = view;
        document.querySelector("#username").style.color = "#4169e1";
        document.querySelector("#profile-view").style.display = "block";
    }

    fetch(`view/${view}/${page}`)
    .then(response => response.json())
    .then(info => {
        // Print posts
        console.log(info)

        if (info.hasOwnProperty("user")) {
            document.querySelector("#user-followers").innerHTML = `<b>Followers:</b> ${info["user"]["followers"]}`;
            document.querySelector("#user-following").innerHTML = `<b>Following:</b> ${info["user"]["following"]}`;

            if (info["user"]["follows"]) {
                button.innerText = "Unfollow";
                button.className = "btn btn-danger";
            } else {
                button.innerText = "Follow";
                button.className = "btn btn-primary";
            }
            button.addEventListener("click", follow)

            if (info["user"]["mutual"]) {
                document.querySelector("#user-follows-message").style.display = "block";
            } else {
                document.querySelector("#user-follows-message").style.display = "none";
            }
        }

        info["posts"].forEach(post => {
            const div = document.createElement("div");
            div.className = "border";

            const top_row = document.createElement("div");
            top_row.className = "row";

            // Username
            const username = document.createElement("a");
            username.className = "col";
            username.innerText = `@${post["user"]}`;
            username.style.cursor = "pointer";
            username.style.color = "#4169e1";
            username.addEventListener("click", () => { view_posts(post["user"]) });
            top_row.append(username);

            // Timestamp
            const timestamp = document.createElement("div");
            timestamp.className = "col-3";
            timestamp.innerText = post["timestamp"];
            timestamp.style.color = "gray";
            timestamp.style.float = "right";
            top_row.append(timestamp);

            div.append(top_row);

            // Text
            const text = document.createElement("div");
            text.className = "row";
            text.style.padding = "10px 25px";
            text.id = `post-${post["id"]}`;
            text.innerText = post["text"];
            div.append(text);

            // Like button
            if (document.querySelector("#new-post")) {
                const likes = document.createElement("button");
                likes.innerText = post["likes"].length;
                likes.id = `likes-${post["id"]}`;
                if (post["likes"].includes(document.querySelector("#user").innerText)) {
                    likes.className = "btn btn-danger";
                } else {
                    likes.className = "btn btn-light";
                }

                likes.addEventListener("click", () => like_post(likes))
                div.append(likes);
            }

            // Edit button
            if (document.querySelector("#user") && document.querySelector("#user").innerText === post["user"]) {
                const edit = document.createElement("button");
                edit.className = "btn btn-info";
                edit.innerText = "Edit";
                edit.style.float = "right";
                edit.addEventListener("click", () => edit_post(text, edit))
                div.append(edit);

                message = document.createElement("label");
                message.id = `message-${post["id"]}`;
                div.append(message);
                message.style.marginTop = "10px";
                message.style.display = "none";
            }

            document.querySelector("#posts-view").append(div);
        });

        // Pagination
        pagination = document.createElement("nav");
        pagination.style.width = "50%";
        ul = document.createElement("ul");
        ul.className = "pagination justify-content-center";

        if (info["pagination"]["previous"]) {
            if (page > 2) {
                li = document.createElement("li");
                text = document.createElement("text");
                li.className = "page-item";
                text.className = "page-link";
                text.innerText = "First";
                li.addEventListener("click", () => view_posts(view))
                li.append(text);
                ul.append(li);
            }

            li = document.createElement("li");
            text = document.createElement("text");
            li.className = "page-item";
            text.className = "page-link";
            text.innerText = "Previous";
            li.append(text);
            li.addEventListener("click", () => view_posts(view, page - 1))
            ul.append(li);

            li = document.createElement("li");
            text = document.createElement("text");
            li.className = "page-item";
            text.className = "page-link";
            text.innerText = page - 1;
            li.append(text);
            li.addEventListener("click", () => view_posts(view, page - 1))
            ul.append(li);
        } else {
            li = document.createElement("li");
            text = document.createElement("text");
            li.className = "page-item disabled";
            text.className = "page-link";
            text.innerText = "Previous";
            li.append(text);
            li.addEventListener("click", () => view_posts(view, page - 1))
            ul.append(li);
        }

        li = document.createElement("li");
        text = document.createElement("text");
        li.className = "page-item active";
        text.className = "page-link";
        text.innerText = page;
        li.append(text);
        li.addEventListener("click", () => view_posts(view, page))
        ul.append(li);

        if (info["pagination"]["next"]) {
            li = document.createElement("li");
            text = document.createElement("text");
            li.className = "page-item";
            text.className = "page-link";
            text.innerText = page + 1;
            li.append(text);
            li.addEventListener("click", () => view_posts(view, page + 1))
            ul.append(li);

            li = document.createElement("li");
            text = document.createElement("text");
            li.className = "page-item";
            text.className = "page-link";
            text.innerText = "Next";
            li.append(text);
            li.addEventListener("click", () => view_posts(view, page + 1))
            ul.append(li);

            if (page < info["pagination"]["last"] - 1) {
                li = document.createElement("li");
                text = document.createElement("text");
                li.className = "page-item";
                text.className = "page-link";
                text.innerText = "Last";
                li.append(text);
                li.addEventListener("click", () => view_posts(view, info["pagination"]["last"]))
                ul.append(li);
            }
        } else {
            li = document.createElement("li");
            text = document.createElement("text");
            li.className = "page-item disabled";
            text.className = "page-link";
            text.innerText = "Next";
            li.append(text);
            li.addEventListener("click", () => view_posts(view, page + 1))
            ul.append(li);
        }
        pagination.append(ul);
        document.querySelector("#posts-view").append(pagination);
    })
}

function new_post() {
    message = document.querySelector("#message");
    text_field = document.querySelector("#text");
    text = text_field.value.trim();
    if (text.length > 0) {
        fetch("/post", {
            method: "POST",
            body: JSON.stringify({
                text: text
            })
        })
        .then(response => response.json())
        .then(result => {
            // Print result
            console.log(result)

            if (result["error"]) {
                message.innerHTML = `<br>${result["error"]}`;
            } else {
                message.innerHTML = "";
                text_field.value = "";
                view_posts("all");
            }
        })
    } else {
        message.innerHTML = "<br>Write something!";
    }
}

async function follow() {
    user = document.querySelector("#username").innerText;
    await fetch(`follow/${user}`);
    view_posts(user);
}

function edit_post(text, button) {
    var id = text.id.split("-")[1];
    message = document.querySelector(`#message-${id}`);
    message.style.display = "none";

    textarea = document.createElement("textarea");
    textarea.innerText = text.innerText;
    textarea.className = "form-control";
    textarea.style.marginBottom = "10px";
    textarea.style.marginTop = "10px";
    text.parentNode.insertBefore(textarea, text);
    text.style.display = "none";

    save = document.createElement("button");
    save.className = "btn btn-primary";
    save.style.float = "right";
    save.innerText = "Save";
    button.parentNode.insertBefore(save, button);
    button.style.display = "none";

    save.addEventListener("click", () => {
        var new_text = textarea.value.trim();

        fetch("/edit", {
            method: "POST",
            body: JSON.stringify({
                id: id,
                text: new_text,
            })
        })
        .then(response => response.json())
        .then(result => {
            // Print result
            console.log(result)

            if (result["error"]) {
                message.innerText = result["error"];
                message.style.color = "red";
            } else if (result["warning"]) {
                textarea.style.display = "none";
                save.style.display = "none";
                text.style.color = "orange";
                text.style.display = "block";

                message.innerText = result["warning"];
                message.style.color = "orange";
            } else {
                textarea.style.display = "none";
                save.style.display = "none";
                text.innerText = new_text;
                text.style.display = "block";
                button.style.display = "block";

                message.innerText = result["message"];
                message.style.color = "blue";
            }
            message.style.display = "block";
        });
    });
}

async function like_post(likes) {
    var id = likes.id.split("-")[1];
    await fetch("/like", {
        method: "POST",
        body: JSON.stringify({
            id: id
        })
    })
    .then(response => response.json())
    .then(post => {
        // Print result
        console.log(post)

        likes.innerText = post["likes"].length;
        if (post["likes"].includes(document.querySelector("#user").innerText)) {
            likes.className = "btn btn-danger";
        } else {
            likes.className = "btn btn-light";
        }
    });
}