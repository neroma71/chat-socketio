let socket = io();

socket.on('connect', function() {
   socket.emit("enter_room", "general"); // Rejoint la salle "general" par défaut
});

function send() {
    let text = document.querySelector('#m').value;
    let pseudo = document.querySelector('#pseudo').value; 

    if (pseudo.trim() === '') {
        alert("Veuillez entrer un pseudo !");
        return;
    }

    if (text.trim() !== '') {
        let message = {
            pseudo: pseudo,
            text: text
        };
        
        console.log('Message à envoyer : ' + JSON.stringify(message));
        socket.emit('chat message', message);
        document.querySelector('#m').value = ''; 
    }
}

socket.on('chat message', (msg) => {
    console.log('Message reçu côté client : ' + JSON.stringify(msg)); 
    let ul = document.querySelector('#messages');
    if (ul) {
        let li = document.createElement('li');
        li.innerText = `${msg.pseudo} : ${msg.text}`; 
        ul.appendChild(li);
        window.scrollTo(0, document.body.scrollHeight);
        console.log('Message ajouté à la liste');
    } else {
        console.log('Erreur : élément <ul> non trouvé');
    }
});

// Gestion des tabs pour changer de salle
document.querySelectorAll("#tabs li").forEach((tab) => {
    tab.addEventListener("click", function() {
        if (!this.classList.contains("active")) {
            const actif = document.querySelector("#tabs li.active");
            actif.classList.remove("active");
            this.classList.add("active");

            socket.emit("leave_room", actif.dataset.room); // Quitter la salle actuelle
            socket.emit("enter_room", this.dataset.room); // Rejoindre la nouvelle salle

            document.querySelector('#messages').innerHTML = ''; // Réinitialise les messages
        }
    });
});
