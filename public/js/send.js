let socket = io();

// Quand on rejoint une salle
socket.on('connect', function() {
    socket.emit("enter_room", "general");
});

function send() {
    let text = document.querySelector('#m').value;
    let pseudo = document.querySelector('#pseudo').value; 
    const room = document.querySelector("#tabs li.active").dataset.room;
    const createdAt = new Date();

    if (pseudo.trim() === '') {
        alert("Veuillez entrer un pseudo !");
        return;
    }

    if (text.trim() !== '') {
        let message = {
            pseudo: pseudo,
            text: text,   // Ceci est utilisé pour remplir 'm' dans la base de données
            room: room,   // Ajoute la room ici
            createdAt: createdAt
        };
        
        console.log('Message à envoyer : ' + JSON.stringify(message));
        socket.emit('chat message', message);
        document.querySelector('#m').value = ''; 
    }
}

function escapeHTML(text) {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
// Afficher les anciens messages quand on rejoint une salle
socket.on('load messages', function(messages) {
    let ul = document.querySelector('#messages');
    ul.innerHTML = ''; // Effacer les messages actuels
    messages.forEach((msg) => {
        let created = new Date(msg.createdAt);
        let li = document.createElement('li');
        li.innerHTML = `${escapeHTML(msg.pseudo)} : <br> le ${created.toLocaleString()} <br> ${escapeHTML(msg.text)}`;
        ul.appendChild(li);
    });
});

// Afficher un nouveau message
socket.on('chat message', function(msg) {
    let created = new Date(msg.createdAt);
    let ul = document.querySelector('#messages');
    let li = document.createElement('li');
    li.innerHTML = `${escapeHTML(msg.pseudo)} : <br> le ${created.toLocaleString()} <br> ${escapeHTML(msg.text)}`;
    ul.appendChild(li);
});

// Changer de salle
document.querySelectorAll("#tabs li").forEach((tab) => {
    tab.addEventListener("click", function() {
        if (!this.classList.contains("active")) {
            const actif = document.querySelector("#tabs li.active");
            actif.classList.remove("active");
            this.classList.add("active");
            document.querySelector('#messages').innerHTML = ""; // Effacer les messages affichés

            // Rejoindre la nouvelle salle et quitter l'ancienne
            socket.emit("enter_room", this.dataset.room);
            socket.emit("leave_room", actif.dataset.room);
        }
    });
});