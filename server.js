const express = require('express');
const app = express();

const path = require("path");

app.use(express.static(path.join(__dirname, "public")));

const http = require('http').Server(app);
const io = require('socket.io')(http);

app.get("/", (req, res)=> {
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket)=> {
    console.log('Utilisateur connecté');

    socket.on('disconnect', ()=> {
        console.log('Utilisateur déconnecté');
    });

    socket.on('chat message', (msg)=> {
        // Utilise directement le pseudo et le texte envoyés par le client
        let message = {
            pseudo: msg.pseudo, // Prends le pseudo depuis le message envoyé
            text: msg.text
        };
        io.emit('chat message', message);
    });
});

http.listen(3000, ()=>{
    console.log("Serveur en cours d'exécution sur le port 3000");
});

