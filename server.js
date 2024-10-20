const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);

app.get("/", function(req, res) {
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket) {
    console.log('Utilisateur connecté');

    socket.on('disconnect', function() {
        console.log('Utilisateur déconnecté');
    });

    socket.on('chat message', function(msg) {
        // Utilise directement le pseudo et le texte envoyés par le client
        let message = {
            pseudo: msg.pseudo, // Prends le pseudo depuis le message envoyé
            text: msg.text
        };
        io.emit('chat message', message);
    });
});

http.listen(3000, function() {
    console.log("Serveur en cours d'exécution sur le port 3000");
});

