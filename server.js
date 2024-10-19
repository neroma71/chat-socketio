var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.get("/", function(req, res) {
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket) {
    console.log('Utilisateur connecté');
    socket.on('disconnect', function() {
        console.log('Utilisateur déconnecté');
    });

    socket.on('chat message', function(msg) {
        console.log('Message reçu : ' + msg); // Vérifie que le message est reçu
        io.emit('chat message', msg); // Émet le message à tous les clients
    });
});

http.listen(3000, function() {
    console.log("Serveur en cours d'exécution sur le port 3000");
});
