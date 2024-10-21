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

    // Charger les anciens messages de la salle lorsque l'utilisateur rejoint
    socket.on('enter_room', async (room) => {
        socket.join(room);
        console.log(`Utilisateur a rejoint la salle : ${room}`);
        
        // Récupérer les messages de la salle
        const messages = await Chat.findAll({
            where: { room },
            order: [['createdAt', 'ASC']]  // Optionnel : pour trier les messages par date
        });
        
        // Envoyer les anciens messages à l'utilisateur qui vient de rejoindre
        socket.emit('load messages', messages);
    });

    // Gestion des messages envoyés
    socket.on('chat message', async (msg) => {
        let message = {
            pseudo: msg.pseudo,
            text: msg.text,  // Utiliser 'm' pour la base de données
            room: msg.room,
            createdAt : msg.createdAt
        };
    
        // Enregistrer le message dans la base de données
        try {
            await Chat.create(message);
            console.log('Message enregistré dans la base de données');
        } catch (error) {
            console.error('Erreur lors de l\'enregistrement du message : ', error);
        }
    
        // Diffuser le message uniquement dans la room
        io.to(msg.room).emit('chat message', message);
    });

    socket.on('leave_room', (room) => {
        socket.leave(room);
        console.log(`Utilisateur a quitté la salle : ${room}`);
    });

    socket.on('disconnect', () => {
        console.log('Utilisateur déconnecté');
    });
});

http.listen(3000, () => {
    console.log("Serveur en cours d'exécution sur le port 3000");
});