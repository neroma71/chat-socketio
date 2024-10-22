let socket = io();

// Quand on rejoint une salle
socket.on('connect', function() {
    socket.emit("enter_room", "general");
});

function send() {
    let text = document.querySelector('#m').value;
    let pseudo = document.querySelector('#pseudo').value;
    const room = document.querySelector("#tabs li.active").dataset.room;
    const createdAt = new Date().toISOString(); // Utilisez toISOString pour envoyer la date en format ISO

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

// Fonction pour échapper les caractères spéciaux
function escapeHTML(text) {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Fonction pour faire défiler vers le bas
function scrollToBottom() {
    let messages = document.querySelector('#messages');
    messages.scrollTop = messages.scrollHeight;
}

// Afficher un nouveau message
socket.on('chat message', function(msg) {
    let created = new Date(msg.createdAt);
    let ul = document.querySelector('#messages');
    let li = document.createElement('li');
    li.innerHTML = `${escapeHTML(msg.pseudo)} : ${created.toLocaleString()} <br> ${escapeHTML(msg.text)}`;
    ul.appendChild(li);
    scrollToBottom(); // Faire défiler vers le bas après l'ajout du message
});

// Afficher les anciens messages quand on rejoint une salle
socket.on('load messages', function(messages) {
    let ul = document.querySelector('#messages');
    ul.innerHTML = ''; // Effacer les messages actuels
    messages.forEach((msg) => {
        let created = new Date(msg.createdAt);
        let li = document.createElement('li');
        li.innerHTML = `${escapeHTML(msg.pseudo)} : ${created.toLocaleString()} <br> ${escapeHTML(msg.text)}`;
        ul.appendChild(li);
    });
    scrollToBottom(); // Faire défiler vers le bas après le chargement des messages
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

// Ajouter un gestionnaire d'événements pour la touche "Enter"
document.querySelector('#m').addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        send();
    }
});
