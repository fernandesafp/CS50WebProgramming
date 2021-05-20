document.addEventListener("DOMContentLoaded", function () {
  document.querySelector("#login-button-div").addEventListener("click", () => {
    var span = document
      .querySelector("#login-button-div")
      .querySelector("span");
    span.innerText = "";
    span.className = "spinner-border spinner-border-sm";
  });

  document
    .querySelector("#register-button-div")
    .addEventListener("click", () => {
      var span = document
        .querySelector("#register-button-div")
        .querySelector("span");
      span.innerText = "";
      span.className = "spinner-border spinner-border-sm";
    });
});
