document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', () => compose_email("", "", ""));

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email(recipient, subject, body) {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = recipient;
  document.querySelector('#compose-subject').value = subject;
  document.querySelector('#compose-body').value = body;
  document.querySelector("#compose-message").innerText = "";

  document.querySelector("#compose-send").addEventListener('click', send_email);
}

function send_email() {
  message = document.querySelector("#compose-message");
  message.innerText = "";
  recipients = document.querySelector("#compose-recipients").value;
  subject = document.querySelector("#compose-subject").value;
  body = document.querySelector("#compose-body").value;

  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
        recipients: recipients,
        subject: subject,
        body: body,
    })
  })
  .then(response => response.json())
  .then(result => {
      // Print result
      console.log(result);

      if (result["error"]) {
        message.innerText = result["error"];
      } else {
        load_mailbox("sent");
      }
  });
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#email-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3><hr>`;

  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    // Print emails
    console.log(emails);

    emails.forEach(email => {
      if ((email["archived"] && mailbox === "archive") || (!email["archived"] && mailbox !== "archive")) {
        const div = document.createElement("div");
        div.className = "row border";
  
        const emailCol = document.createElement("div");
        emailCol.className = "col";
        if (mailbox === "sent") {
          emailCol.innerText = `To: ${email["recipients"]}`;
        } else {
          emailCol.innerText = `From: ${email["sender"]}`;
        }
  
        const subjectCol = document.createElement("div");
        subjectCol.className = "col";
        subjectCol.innerText = email["subject"];
  
        const timestampCol = document.createElement("div");
        timestampCol.className = "float-right";
        timestampCol.style.color = "darkgray";
        timestampCol.innerText = email["timestamp"];
  
        div.append(emailCol);
        div.append(subjectCol);
        div.append(timestampCol);

        if (email["read"] && mailbox !== "sent"){
        div.style.backgroundColor = "gray";
        emailCol.style.color = "darkgray";
        subjectCol.style.color = "darkgray";
        timestampCol.style.color = "darkgray";
        } else if (mailbox !== "sent") {
          timestampCol.style.color = "gray";
          emailCol.style.fontWeight = "bold";
          subjectCol.style.fontWeight = "bold";
          timestampCol.style.fontWeight = "bold";
        } else {
          timestampCol.style.color = "gray";
        }

        div.addEventListener("click", () => { view_email(email["id"], mailbox)});
        div.style.cursor = "pointer";
        document.querySelector("#emails-view").append(div);
      }
    });
  });
}

function view_email(id, mailbox) {
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';


  const emailDiv = document.querySelector('#email-view');
  emailDiv.innerHTML = "";
  emailDiv.style.display = 'block';

  fetch(`/emails/${id}`)
  .then(response => response.json())
  .then(email => {
      // Print email
      console.log(email);

      const div = document.createElement("div");
      div.innerHTML = `<b>From: </b> ${email["sender"]}<br>`;
      div.innerHTML = div.innerHTML + `<b>To: </b> ${email["recipients"]}<br>`
      div.innerHTML = div.innerHTML + `<b>Subject: </b> ${email["subject"]}<br>`
      div.innerHTML = div.innerHTML + `<b>Timestamp: </b> ${email["timestamp"]}<br>`

      if (mailbox !== "sent") {
        const button = document.createElement("input");
        button.type = "button";
        if (email["archived"]) {
          button.value = "Remove from archive";
        } else {
          button.value = "Add to archive";
        }
        button.className = "btn btn-warning";
        button.onclick = function() {
          archive(id, email["archived"]);
        };
        div.append(button);
      }

      const body = document.createElement("div");
      body.innerHTML = `<hr>${email["body"]}<hr>`;
      div.append(body);

      if (mailbox !== "sent") {
        const reply = document.createElement("input");
        reply.type = "button";
        reply.value = "Reply";
        reply.className = "btn btn-primary";

        var responseSubject = email["subject"];
        if (!responseSubject.startsWith("Re: ")) {
          responseSubject = `Re: ${responseSubject}`;
        }

        var responseBody = `On ${email["timestamp"]} ${email["sender"]} wrote: ${email["body"]}`;

        reply.onclick = function() {
          compose_email(email["sender"], responseSubject, responseBody);
        };
        div.append(reply);
      }

      emailDiv.append(div);
  });

  fetch(`/emails/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
        read: true
    })
  })
}

async function archive(id, archived) {
  await fetch(`/emails/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
        archived: !archived
    })
  });
  load_mailbox("inbox");
}