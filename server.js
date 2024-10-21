const express = require('express');
const app = express();
const path = require("path");

app.use(express.static(path.join(__dirname, "public")));

const http = require('http').Server(app);
const io = require('socket.io')(http);

// Charger Sequelize et SQLite
const Sequelize = require("sequelize");
const dbPath = path.resolve(__dirname, "chat.sqlite");

const sequelize = new Sequelize("database", "username", "password", {
    host: "localhost", 
    dialect: "sqlite",
    logging: false,
    storage: dbPath
});

// Charger le modèle Chat
const Chat = require("./Models/Chat")(sequelize, Sequelize.DataTypes);
Chat.sync();

app.get("/", (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
    console.log('Utilisateur connecté');

    socket.on('disconnect', () => {
        console.log('Utilisateur déconnecté');
    });

    socket.on('chat message', (msg) => {
        let message = {
            pseudo: msg.pseudo,
            text: msg.text
        };
        io.to([...socket.rooms][1]).emit('chat message', message); // Envoie le message uniquement à la room
    });

    // Gestion des salles
    socket.on('enter_room', (room) => {
        socket.join(room);
        console.log(`Utilisateur a rejoint la salle : ${room}`);
        console.log('Rooms après avoir rejoint :', socket.rooms);
    });

    socket.on('leave_room', (room) => {
        socket.leave(room);
        console.log(`Utilisateur a quitté la salle : ${room}`);
        console.log('Rooms après avoir quitté :', socket.rooms);
    });
});

http.listen(3000, () => {
    console.log("Serveur en cours d'exécution sur le port 3000");
});
