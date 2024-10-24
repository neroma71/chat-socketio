let socket = io();
let currentRoom = 'general'; // Variable pour suivre la salle actuelle

// Quand on rejoint une salle
socket.on('connect', function() {
    // Charger les anciens messages lors de la connexion
    socket.emit("enter_room", currentRoom);
});

// Envoyer un message
function send() {
    let text = document.querySelector('#m').value;
    const pseudo = document.querySelector('#pseudo').value.trim(); // Obtenir le pseudo
    const room = document.querySelector("#tabs li.active").dataset.room;
    const createdAt = new Date().toISOString();

    if (pseudo === '') {
        alert("Veuillez entrer un pseudo !");
        return;
    }

    if (text.trim() !== '') {
        let message = {
            pseudo: pseudo,
            text: text,
            room: room,
            createdAt: createdAt
        };

        console.log('Message à envoyer : ' + JSON.stringify(message));
        socket.emit('chat message', message);
        document.querySelector('#m').value = '';

        // Informer le serveur que l'utilisateur a rejoint la salle avec le pseudo
        socket.emit("enter_room", room, pseudo); // On envoie le pseudo à chaque envoi de message
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
    li.innerHTML = `<strong>${escapeHTML(msg.pseudo)}</strong> : le <i>${created.toLocaleString()}</i><p>${escapeHTML(msg.text)}</p>`;
    ul.appendChild(li);
    scrollToBottom();
});

// Afficher les anciens messages quand on rejoint une salle
socket.on('load messages', function(messages) {
    let ul = document.querySelector('#messages');
    ul.innerHTML = ''; // Effacer les messages actuels
    messages.forEach((msg) => {
        let created = new Date(msg.createdAt);
        let li = document.createElement('li');
        li.innerHTML = `<strong>${escapeHTML(msg.pseudo)}</strong> : le <i>${created.toLocaleString()}</i><p>${escapeHTML(msg.text)}</p>`;
        ul.appendChild(li);
    });
    scrollToBottom();
});

// Afficher la liste des utilisateurs
socket.on('user list', function(usernames) {
    let userList = document.querySelector('#users');
    userList.innerHTML = ''; // Effacer la liste actuelle
    usernames.forEach((username) => {
        if (username.trim() !== '') { // Vérifier que le pseudo n'est pas vide
            let li = document.createElement('li');
            li.textContent = username;
            userList.appendChild(li);
        }
    });
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
            const newRoom = this.dataset.room;
            socket.emit("leave_room", actif.dataset.room);
            socket.emit("enter_room", newRoom, document.querySelector('#pseudo').value); // Passer le pseudo au serveur
            currentRoom = newRoom; // Mettre à jour la salle actuelle
        }
    });
});

// Ajouter un gestionnaire d'événements pour la touche "Enter"
document.querySelector('#m').addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        send();
    }
});
