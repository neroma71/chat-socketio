const express = require('express');
const app = express();
const path = require("path");
const http = require('http').Server(app);
const io = require('socket.io')(http);
const Sequelize = require("sequelize");

// Configuration pour SQLite
const dbPath = path.resolve(__dirname, "chat.sqlite");
const sequelize = new Sequelize("database", "username", "password", {
    dialect: "sqlite",
    logging: false,
    storage: dbPath
});

// Charge le modèle Chat
const Chat = require("./Models/Chat")(sequelize, Sequelize.DataTypes);
Chat.sync();

// Middleware pour servir des fichiers statiques
app.use(express.static(path.join(__dirname, "public")));

// Route principale
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Liste des utilisateurs connectés par salle
let users = {}; // clé: room, valeur: { socket.id: pseudo }

// Fonction pour échapper les caractères spéciaux
function escapeHTML(text) {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

// Gestion des connexions Socket.io
io.on('connection', (socket) => {
    console.log('Utilisateur connecté');

    // Quand un utilisateur entre dans une salle
    socket.on('enter_room', async (room, pseudo) => {
        // Vérifier si le pseudo est déjà utilisé dans la salle
        const existingUser = Object.values(users[room] || {}).includes(pseudo) && users[room][socket.id] !== pseudo;

        if (existingUser) {
            // Émettre un message d'erreur au client
            socket.emit('username taken', 'Ce pseudo est déjà utilisé. Veuillez en choisir un autre.');
            return;
        }

        socket.join(room);
        console.log(`Utilisateur ${pseudo} a rejoint la salle : ${room}`);

        // Ajoute l'utilisateur à la liste des utilisateurs de la salle
        if (!users[room]) {
            users[room] = {};
        }
        users[room][socket.id] = pseudo; // Stocke le pseudo de l'utilisateur

        // Charger les anciens messages de la salle
        const messages = await Chat.findAll({
            where: { room },
            order: [['createdAt', 'ASC']]
        });

        // Envoyer les anciens messages à l'utilisateur qui vient de rejoindre le tchat
        socket.emit('load messages', messages);

        // Émettre la liste des utilisateurs connectés à tous dans la salle
        io.to(room).emit('user list', Object.values(users[room]));
    });

    socket.on('chat message', async (msg) => {
        try {
            // Vérifie si le pseudo est déjà utilisé dans la salle
            const existingUser = Object.values(users[msg.room] || {}).includes(msg.pseudo) && users[msg.room][socket.id] !== msg.pseudo;

            if (existingUser) {
                // Émet un message d'erreur au client
                socket.emit('username taken', 'Ce pseudo est déjà utilisé. Veuillez en choisir un autre.');
                return;
            }

            // Échappe les caractères spéciaux
            msg.text = escapeHTML(msg.text);
            msg.pseudo = escapeHTML(msg.pseudo);

            await Chat.create(msg);
            console.log('Message enregistré dans la base de données');
            // Émet le message à tous les utilisateurs dans la salle
            io.to(msg.room).emit('chat message', msg);
        } catch (error) {
            console.error('Erreur lors de l\'enregistrement du message : ', error);
        }
    });

    //Message qui indique que quelqu'un tape
    socket.on('typing', msg => {
        socket.to(msg.room).emit("usertyping", msg);
    });

    socket.on('leave_room', (room) => {
        socket.leave(room);
        console.log(`Utilisateur ${users[room][socket.id]} a quitté la salle : ${room}`);

        // Supprime l'utilisateur de la liste des utilisateurs de la salle
        delete users[room][socket.id];

        // Émet la liste mise à jour des utilisateurs à tous les clients dans la salle
        io.to(room).emit('user list', Object.values(users[room]));
    });

    socket.on('disconnect', () => {
        console.log(`Utilisateur déconnecté`);

        // Supprime l'utilisateur de toutes les salles
        for (let room in users) {
            if (users[room][socket.id]) {
                delete users[room][socket.id];
                io.to(room).emit('user list', Object.values(users[room]));
            }
        }
    });
});

// Démarre le serveur
http.listen(3000, () => {
    console.log("Serveur en cours d'exécution sur le port 3000");
});