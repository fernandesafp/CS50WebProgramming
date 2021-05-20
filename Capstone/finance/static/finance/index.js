document.addEventListener("DOMContentLoaded", function () {
  document
    .querySelector(".hamburger__inner")
    .addEventListener("click", toggleWrapper);
  document.querySelector("#main-container").addEventListener("click", () => {
    toggleWrapper(false);
  });

  document.querySelectorAll(".sidebar-option").forEach(function (option) {
    option.style.cursor = "pointer";
    option.addEventListener("click", () => {
      view_option(option);
    });
  });
  view_option(document.querySelector(".sidebar-option"));

  if(window.innerWidth <= 750) {
    toggleWrapper(false);
  }

  window.onresize = () => {
    if (window.innerWidth <= 750) {
      toggleWrapper(false);
    }
  };

  load_database();
  document.querySelector("#vehicle-brand").addEventListener("change", function() {
    var brand = document.querySelector("#vehicle-brand").value.replace(" ", "-").toLowerCase();
    document.querySelector("#vehicle-model").setAttribute("list", `vehicle-models-${brand}`)  ;
  });
});

function view_option(option) {
  //Changes title and activates correct section
  document.querySelector("title").innerHTML = `Auto Sales - ${
    option.querySelector(".title").innerText
  }`;
  if (document.querySelector(".sidebar__inner").querySelector(".active")) {
    toggleWrapper(false);
  } else {
    document.querySelector(".sidebar-option").className = "active";
  }
  document.querySelector(".sidebar__inner").querySelector(".active").className =
    ".sidebar-option";
  option.className = "active";

  // Clears the profile section labels with possible errors
  document.querySelector("#update-details-label").innerText = "";
  document.querySelector("#update-password-label").innerText = "";
  document.querySelector("#new-vehicle-label").innerText = "";
  document.querySelector("#new-transaction-label").innerText = "";
  document.querySelector("#new-task-label").innerText = "";
  document.querySelector("#new-contact-label").innerText = "";

  // Hides blocked section and lastly shows the correct one
  document
    .querySelector("#main-container")
    .querySelectorAll(".row")
    .forEach(function (row) {
      row.style.display = "none";
    });

  // In case it contains nav items to handle showing and hiding divs
  var main_window = document.querySelector(
    `#${option.querySelector(".title").innerText.toLowerCase()}`
  );
  if (main_window.querySelector(".nav-item")) {
    main_window.querySelectorAll(".nav-item").forEach(function (nav) {
      var tab_view = nav
        .querySelector(".nav-link")
        .innerText.replace(" ", "-")
        .toLowerCase();
      nav.style.cursor = "pointer";
      document.querySelector(`#${tab_view}`).style.display = "none";
      nav.addEventListener("click", () => {
        view_tab(main_window, nav);
      });
    });
    view_tab(main_window, main_window.querySelector(".nav-item"));
  }

  var view = option.querySelector(".title").innerText.toLowerCase()
  document.querySelector(`#${view.toLowerCase()}`).style.display = "block";
  showAnimation(main_window);
}

function view_tab(main_window, new_nav) {
  // Clears the profile section labels with possible errors
  if (document.querySelector("#update-details-label")) {
    document.querySelector("#update-details-label").innerText = "";
    document.querySelector("#update-password-label").innerText = "";
  }

  main_window.querySelectorAll(".nav-item").forEach(function (nav) {
    var link = nav.querySelector(".nav-link");
    if (link.className.includes("active")) {
      var tab_view = nav
        .querySelector(".nav-link")
        .innerText.replace(" ", "-")
        .toLowerCase();
      nav.querySelector(".nav-link").className = "nav-link";
      document.querySelector(`#${tab_view}`).style.display = "none";
    }
  });
  var new_tab_view = new_nav
    .querySelector(".nav-link")
    .innerText.replace(" ", "-")
    .toLowerCase();
  new_nav.querySelector(".nav-link").className = "nav-link active";
  main_window.querySelector(`#${new_tab_view}`).style.display = "block";
}

async function load_database(view = "all") {
  var makes = document.querySelector("#vehicle-makes");

  await fetch(`/load/${view}`, {
    method: "POST",
    headers: {
      "X-CSRFToken": getCookie("csrftoken"),
    },
  })
  .then(response => response.json())
  .then(result => {
    console.log(result);

    if (result["makes"]) {
      makes.innerHTML = "";
      result["makes"].forEach(make => {
        var option = document.createElement("option");
        option.value = make["brand"];
        makes.append(option);
      });
    }
    if (result["models"]) {
      result["models"].forEach(model => {
        var brand_name = model["brand"].replace(" ", "-").toLowerCase();
        var brand_list = document.querySelector(`#vehicle-models-${brand_name}`);
        if (!brand_list) {
          brand_list = document.createElement("datalist");
          brand_list.id = `vehicle-models-${brand_name}`;
          makes.parentNode.insertBefore(brand_list, makes.nextSibling);
        } else {
          brand_list.innerHTML = "";
        }
      })
      result["models"].forEach(model => {
        var brand_name = model["brand"].replace(" ", "-").toLowerCase();
        var brand_list = document.querySelector(`#vehicle-models-${brand_name}`);
        var option = document.createElement("option");
        option.value = model["model"];
        brand_list.append(option);
      });
    }
    if (result["contacts"]) {
      var contacts = document.querySelector("#contact-list");
      contacts.innerHTML = "";
      var list = document.querySelector("#list");
      list.innerHTML = "";

      result["contacts"].forEach(contact => {
        var option = document.createElement("option");
        option.value = contact["name"];
        contacts.append(option);

        var grid = document.createElement("div");
        grid.className = "grid-item border"
        grid.style.maxWidth = "500px";
        grid.style.padding = "15px";
        grid.style.marginBottom = "15px";
        var btn_delete = document.createElement("button");
        btn_delete.className = "btn btn-light fas fa-trash";
        btn_delete.style.float = "right";
        btn_delete.setAttribute("onclick", `update_item(${contact["id"]}, "contact", true);`)
        grid.append(btn_delete);
        grid.innerHTML = `${grid.innerHTML}<b>${contact["name"]}</b><br>`
        if (contact["phone"]) {
          grid.innerHTML = `${grid.innerHTML}📞 <a href="tel:${contact["phone"]}" target="_blank" rel="noopener noreferrer">${contact["phone"]}</a>`
        }
        grid.innerHTML = `${grid.innerHTML}<br>`;
        if (contact["email"]) {
          grid.innerHTML = `${grid.innerHTML}📧 <a href="mailto:${contact["email"]}" target="_blank" rel="noopener noreferrer">${contact["email"]}</a>`
        }
        grid.innerHTML = `${grid.innerHTML}<br>`;
        if (contact["address"]) {
          grid.innerHTML = `${grid.innerHTML}${contact["address"]}`;
        }
        list.append(grid);
      });
    }
    if (result["tasks"]) {
      var todo = document.querySelector("#to-do");
      var done = document.querySelector("#done");
      todo.innerHTML = "";
      done.innerHTML = "";

      result["tasks"].forEach(task => {
        var grid = document.createElement("div");
        grid.className = "grid-item border"
        grid.style.maxWidth = "500px";
        grid.style.padding = "15px";
        grid.style.marginBottom = "15px";
        var btn_delete = document.createElement("button");
        btn_delete.className = "btn btn-light fas fa-trash";
        btn_delete.style.float = "right";
        btn_delete.setAttribute("onclick", `update_item(${task["id"]}, "task", true);`)
        grid.append(btn_delete);
        grid.innerHTML = `${grid.innerHTML}<label style="font-size:20px;">${task["description"]}</label><br>`
        if (task["contact"]) {
          grid.innerHTML = `${grid.innerHTML}<label class="fas fa-address-book"></label> ${task["contact"]}<br>`
        }
        if (task["vehicle"]) {
          grid.innerHTML = `${grid.innerHTML}<label class="fas fa-car"></label> ${task["vehicle"]}<br>`;
        }
        grid.innerHTML = `${grid.innerHTML}<label style="color:gray;font-size:12px;">${task["timestamp"]}</label>`;
        if (task["completed"]) {
          done.append(grid);
        } else {
          var btn_complete = document.createElement("button");
          btn_complete.style.float = "right";
          btn_complete.setAttribute("onclick", `update_item(${task["id"]}, "task", false);`)
          grid.append(btn_complete);
          btn_complete.className = "btn btn-light fas fa-check";
          todo.append(grid);
        }
      });
    }
    if (result["transactions"]) {
      var list = document.querySelector("#cash-flow");
      list.innerHTML = "";

      result["transactions"].forEach(transaction => {
        var grid = document.createElement("div");
        grid.className = "grid-item border"
        grid.style.maxWidth = "500px";
        grid.style.padding = "15px";
        grid.style.marginBottom = "15px";
        grid.innerHTML = `${grid.innerHTML}<label><b>${transaction["contact"]}</b></label>`
        grid.innerHTML = `${grid.innerHTML}<label style="float:right;">${transaction["transaction_type"]}</label><br>`
        if (transaction["vehicle"]) {
          grid.innerHTML = `${grid.innerHTML}<label class="fas fa-car"></label> ${transaction["vehicle"]}<br>`;
        }
        if (transaction["description"]) {
          grid.innerHTML = `${grid.innerHTML}<label style="font-size:14px;">${transaction["description"]}</label><br>`
        }
        grid.innerHTML = `${grid.innerHTML}<label style="color:gray;font-size:12px;">${transaction["timestamp"]}</label>`;
        if (transaction["transaction_type"] === "Purchase" || transaction["transaction_type"] === "Expense") {
          grid.innerHTML = `${grid.innerHTML}<label style="float:right;color:red;">- ${transaction["value"].toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")} €</label>`
        } else {
          grid.innerHTML = `${grid.innerHTML}<label style="float:right;color:green;">+ ${transaction["value"].toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")} €</label>`
        }
        list.append(grid);
      });
    }
    if(result["garage"]) {
      var vehicle_list = document.querySelector("#vehicle-list");
      var garage = document.querySelector("#garage");
      var sold = document.querySelector("#sold");
      vehicle_list.innerHTML = "";
      garage.innerHTML = "";
      sold.innerHTML = "";
      result["garage"].forEach(vehicle => {
        var option = document.createElement("option");
        var value = vehicle["make"];
        if (vehicle["model"]) {
          value += ` ${vehicle["model"]}`;
        }
        value += ` ${vehicle["year"]}`;
        option.value = `${vehicle["id"]} | ${value}`;
        vehicle_list.append(option);

        var grid = document.createElement("div");
        grid.className = "grid-item border"
        grid.style.maxWidth = "500px";
        grid.style.padding = "15px";
        grid.style.marginBottom = "15px";
        var table = document.createElement("table");
        var tr_main = document.createElement("tr");
        var td_image = document.createElement("td");
        td_image.innerHTML = `<img src="${vehicle["image"]}" style="max-width:250px;max-height:250px;margin-right:20px;width:250px;height:auto;">`;
        tr_main.append(td_image);
        if (window.innerWidth > 750) {
          var td_details = document.createElement("td");
          td_details.innerHTML = `${vehicle["make"]} ${vehicle["model"]}<br>${vehicle["year"]}<br>`;
          td_details.innerHTML = `${td_details.innerHTML}${vehicle["mileage"].toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")} km<br>`;
          if (vehicle["plate"]) {
            td_details.innerHTML = `${td_details.innerHTML}${vehicle["plate"]}<br>`;
          }
          var total_cost = vehicle["cost"];
          if (result["stats"][vehicle["id"]]) {
            td_details.innerHTML = `${td_details.innerHTML}Bought: ${vehicle["cost"].toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")} €<br>`;
            td_details.innerHTML = `${td_details.innerHTML}Expenses: ${result["stats"][vehicle["id"]].toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")} €<br>`;
            td_details.innerHTML = `${td_details.innerHTML}<b>Total: ${(vehicle["cost"] + result["stats"][vehicle["id"]]).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")} €</b><br>`;
            total_cost += result["stats"][vehicle["id"]];
          } else {
            td_details.innerHTML = `${td_details.innerHTML}<b>Bought: ${vehicle["cost"].toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")} €</b><br>`;
          }
          if (result["sold"][vehicle["id"]]) {
            td_details.innerHTML = `${td_details.innerHTML}<b>Sold: ${result["sold"][vehicle["id"]].toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")} €</b><br>`;
            var profit = result["sold"][vehicle["id"]] - total_cost;
            if (profit > 0) {
              td_details.innerHTML = `${td_details.innerHTML}<b style="font-size:20px;color:green;">Profit: ${profit.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")} €</b><br>`;
            } else {
              td_details.innerHTML = `${td_details.innerHTML}<b style="color:red;">Profit: ${profit.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")} €</b><br>`;
            }
          }
          td_details.innerHTML = `${td_details.innerHTML}<label style="color:gray;font-size:12px;">${vehicle["timestamp"]}</label>`;
          table.append(tr_main);
          tr_main.append(td_details);
        } else {
          var td_button = document.createElement("td");
          tr_main.append(td_button);
          var tr_details = document.createElement("tr");
          tr_details.innerHTML = `<br>${vehicle["make"]} ${vehicle["model"]}<br>${vehicle["year"]}<br>`;
          tr_details.innerHTML = `${tr_details.innerHTML}${vehicle["mileage"].toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")} km<br>`;
          if (vehicle["plate"]) {
            tr_details.innerHTML = `${tr_details.innerHTML}${vehicle["plate"]}<br>`;
          }
          var total_cost = vehicle["cost"];
          if (result["stats"][vehicle["id"]]) {
            tr_details.innerHTML = `${tr_details.innerHTML}Bought: ${vehicle["cost"].toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")} €<br>`;
            tr_details.innerHTML = `${tr_details.innerHTML}Expenses: ${result["stats"][vehicle["id"]].toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")} €<br>`;
            tr_details.innerHTML = `${tr_details.innerHTML}<b>Total: ${(vehicle["cost"] + result["stats"][vehicle["id"]]).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")} €</b><br>`;
            total_cost += result["stats"][vehicle["id"]];
          } else {
            tr_details.innerHTML = `${tr_details.innerHTML}<b>Bought: ${vehicle["cost"].toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")} €</b><br>`;
          }
          if (result["sold"][vehicle["id"]]) {
            tr_details.innerHTML = `${tr_details.innerHTML}<b>Sold: ${result["sold"][vehicle["id"]].toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")} €</b><br>`;
            var profit = result["sold"][vehicle["id"]] - total_cost;
            if (profit > 0) {
              tr_details.innerHTML = `${tr_details.innerHTML}<b style="font-size:20px;color:green;">Profit: ${profit.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")} €</b><br>`;
            } else {
              tr_details.innerHTML = `${tr_details.innerHTML}<b style="font-size:20px;color:red;">Profit: ${profit.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")} €</b><br>`;
            }
          }
          tr_details.innerHTML = `${tr_details.innerHTML}<label style="color:gray;font-size:12px;">${vehicle["timestamp"]}</label>`;
          table.append(tr_main);
          table.append(tr_details);
        }

        if (vehicle["note"]) {
          tr_notes = document.createElement("tr");
          tr_notes.innerHTML = `<td style="font-size:12px;">Note: ${vehicle["note"]}</td>`
          table.append(tr_notes);
        }
        var tr_stats = document.createElement("tr");
        var td_stats = document.createElement("td");
        td_stats.innerHTML = "";
        table.append(tr_stats);
        grid.append(table);

        if (result["sold"][vehicle["id"]]) {
          sold.append(grid);
        } else {
          garage.append(grid);
        }
      });
    }
  });
}

async function add_vehicle() {
  // Clears the vehicle section labels with possible errors
  document.querySelector("#new-vehicle-label").innerText = "";

  var form = document.querySelector("#new-vehicle");
  var brand = form.querySelector("#vehicle-brand");
  var model = form.querySelector("#vehicle-model");
  var mileage = form.querySelector("#vehicle-mileage");
  var year = form.querySelector("#vehicle-year");
  var plate = form.querySelector("#vehicle-plate");
  var contact = form.querySelector("#vehicle-contact");
  var cost = form.querySelector("#vehicle-cost");
  var value = form.querySelector("#vehicle-value");
  var note = form.querySelector("#vehicle-notes");

  await fetch("new/vehicle", {
    method: "POST",
    body: JSON.stringify({
      brand: brand.value,
      model: model.value,
      mileage: mileage.value,
      year: year.value,
      plate: plate.value,
      contact: contact.value,
      cost: cost.value,
      value: value.value,
      note: note.value,
    }),
    headers: {
      "X-CSRFToken": getCookie("csrftoken"),
    },
  })
  .then((response) => response.json())
  .then((result) => {
    console.log(result);

    if (result["error"]) {
      document.querySelector("#new-vehicle-label").style.color = "red";
      document.querySelector("#new-vehicle-label").innerText = result["error"];
    } else {
      document.querySelector("#new-vehicle-label").style.color = "blue";
      document.querySelector("#new-vehicle-label").innerText = result["message"];
      brand.value = "";
      model.value = "";
      mileage.value = "";
      year.value = "";
      plate.value = "";
      contact.value = "";
      cost.value = "";
      value.value = "";
      note.value = "";

      load_database();
    }
  });
}

async function add_transaction() {
  // Clears the vehicle section labels with possible errors
  document.querySelector("#new-transaction-label").innerText = "";

  var form = document.querySelector("#new-transaction");
  var type = form.querySelector("#transaction-type");
  var value = form.querySelector("#transaction-value");
  var contact = form.querySelector("#transaction-contact");
  var vehicle = form.querySelector("#transaction-vehicle");
  var description = form.querySelector("#transaction-description");

  await fetch("new/transaction", {
    method: "POST",
    body: JSON.stringify({
      type: type.value,
      value: value.value,
      contact: contact.value,
      vehicle: vehicle.value,
      description: description.value
    }),
    headers: {
      "X-CSRFToken": getCookie("csrftoken"),
    },
  })
  .then((response) => response.json())
  .then((result) => {
    console.log(result);

    if (result["error"]) {
      document.querySelector("#new-transaction-label").style.color = "red";
      document.querySelector("#new-transaction-label").innerText = result["error"];
    } else {
      document.querySelector("#new-transaction-label").style.color = "blue";
      document.querySelector("#new-transaction-label").innerText = result["message"];
      type.value = "";
      value.value = "";
      contact.value = "";
      vehicle.value = "";
      description.value = "";

      load_database("transactions");
      load_database("garage");
    }
  });
}

async function add_task() {
  // Clears the vehicle section labels with possible errors
  document.querySelector("#new-task-label").innerText = "";

  var form = document.querySelector("#new-task");
  var task = form.querySelector("#task-name");
  var contact = form.querySelector("#task-contact");
  var vehicle = form.querySelector("#task-vehicle");

  await fetch("new/task", {
    method: "POST",
    body: JSON.stringify({
      task: task.value,
      contact: contact.value,
      vehicle: vehicle.value
    }),
    headers: {
      "X-CSRFToken": getCookie("csrftoken"),
    },
  })
  .then((response) => response.json())
  .then((result) => {
    console.log(result);

    if (result["error"]) {
      document.querySelector("#new-task-label").style.color = "red";
      document.querySelector("#new-task-label").innerText = result["error"];
    } else {
      document.querySelector("#new-task-label").style.color = "blue";
      document.querySelector("#new-task-label").innerText = result["message"];
      task.value = "";
      contact.value = "";
      vehicle.value = "";

      load_database("tasks");
    }
  });
}

async function add_contact() {
  // Clears the contact section labels with possible errors
  document.querySelector("#new-contact-label").innerText = "";

  var form = document.querySelector("#new-contact");
  var name = form.querySelector("#contact-name");
  var phone = form.querySelector("#contact-phone");
  var email = form.querySelector("#contact-email");
  var address = form.querySelector("#contact-address");

  await fetch("/new/contact", {
    method: "POST",
    body: JSON.stringify({
      name: name.value,
      phone: phone.value,
      email: email.value,
      address: address.value,
    }),
    headers: {
      "X-CSRFToken": getCookie("csrftoken"),
    },
  })
  .then((response) => response.json())
  .then((result) => {
    console.log(result);

    if (result["error"]) {
      document.querySelector("#new-contact-label").style.color = "red";
      document.querySelector("#new-contact-label").innerText = result["error"];
    } else {
      document.querySelector("#new-contact-label").style.color = "blue";
      document.querySelector("#new-contact-label").innerText = result["message"];
      name.value = "";
      phone.value = "";
      email.value = "";
      address.value = "";

      load_database("contacts");
    }
  });
}

async function update_details() {
  // Clears the profile section labels with possible errors
  document.querySelector("#update-details-label").innerText = "";
  document.querySelector("#update-password-label").innerText = "";

  var form = document.querySelector("#update-details");
  var first_name = form.querySelector("#first_name");
  var last_name = form.querySelector("#last_name");
  var email = form.querySelector("#email");

  await fetch("/edit/details", {
    method: "POST",
    body: JSON.stringify({
      first_name: first_name.value,
      last_name: last_name.value,
      email: email.value,
    }),
    headers: {
      "X-CSRFToken": getCookie("csrftoken"),
    },
  })
    .then((response) => response.json())
    .then((result) => {
      console.log(result);

      if (result["error"]) {
        document.querySelector("#update-details-label").style.color = "red";
        document.querySelector("#update-details-label").innerText = result["error"];
      } else {
        document.querySelector("#update-details-label").style.color = "blue";
        document.querySelector("#update-details-label").innerText = result["message"];
        if (first_name.value) {
          document.querySelector(
            "#welcome"
          ).innerText = `Welcome, ${first_name.value}`;
        } else {
          document.querySelector("#welcome").innerText = "Welcome";
        }
      }
    });
}

async function update_password() {
  // Clears the profile section labels with possible errors
  document.querySelector("#update-details-label").innerText = "";
  document.querySelector("#update-password-label").innerText = "";

  var form = document.querySelector("#change-password");
  var password = form.querySelector("#password");
  var new_password = form.querySelector("#new_password");
  var new_confirmation = form.querySelector("#new_confirmation");

  await fetch("/edit/password", {
    method: "POST",
    body: JSON.stringify({
      password: password.value,
      new_password: new_password.value,
      new_confirmation: new_confirmation.value,
    }),
    headers: {
      "X-CSRFToken": getCookie("csrftoken"),
    },
  })
    .then((response) => response.json())
    .then((result) => {
      console.log(result);

      if (result["error"]) {
        document.querySelector("#update-password-label").style.color = "red";
        document.querySelector("#update-password-label").innerText =
          result["error"];
      } else {
        document.querySelector("#update-password-label").style.color = "blue";
        document.querySelector("#update-password-label").innerText =
          result["message"];
      }
      password.value = "";
      new_password.value = "";
      new_confirmation.value = "";
    });
}

async function update_item(id, type, remove) {
  await fetch("/new/update", {
    method: "POST",
    body: JSON.stringify({
      id: id,
      type: type,
      remove: remove,
    }),
    headers: {
      "X-CSRFToken": getCookie("csrftoken"),
    },
  })

  load_database();
}

function getCookie(c_name) {
  if (document.cookie.length > 0) {
    c_start = document.cookie.indexOf(c_name + "=");
    if (c_start != -1) {
      c_start = c_start + c_name.length + 1;
      c_end = document.cookie.indexOf(";", c_start);
      if (c_end == -1) c_end = document.cookie.length;
      return unescape(document.cookie.substring(c_start, c_end));
    }
  }
  return "";
}

function showAnimation(element) {
  element.style.animationDuration = "0.75s";
  element.style.iterationCount = "1";
  element.style.fillMode = "forwards";
  element.style.animationName = "show";
}

function toggleWrapper(can_extend = true) {
  // The can_extend works as a way to force the wrapper to always close in case it is open
  var wrapper = document.querySelector(".wrapper");
  if (wrapper.className.includes("active") && can_extend) {
    wrapper.className = "wrapper";
  } else {
    wrapper.className = "wrapper active";
  }
}
