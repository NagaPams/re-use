const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const pool = require('./config/db'); 

// Importar rutas
const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');
const path = require('path'); 
const publicationRoutes = require('./routes/publicationRoutes');
const chatRoutes = require('./routes/chatRoutes'); 
const savedRoutes = require('./routes/savedRoutes');
const transactionRoutes = require('./routes/transactionRoutes');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST", "PUT", "DELETE"] }
});

// Mapa para rastrear qué usuario tiene qué socket abierto
const connectedUsers = new Map();

io.on('connection', (socket) => {
    console.log(`Nueva conexión Socket.io: ${socket.id}`);

    // El frontend enviará este evento en cuanto el usuario inicie sesión
    socket.on('register_user', (userId) => {
        connectedUsers.set(userId, socket.id);
        console.log(`Usuario ${userId} mapeado al socket ${socket.id}`);
    });

    socket.on('disconnect', () => {
        // Limpiar el mapa cuando el usuario cierre la pestaña
        for (const [userId, socketId] of connectedUsers.entries()) {
            if (socketId === socket.id) {
                connectedUsers.delete(userId);
                break;
            }
        }
        console.log(`Socket desconectado: ${socket.id}`);
    });
});

// Inyectar 'io' y 'connectedUsers' en la app de Express para usarlos en los controladores
app.set('io', io);
app.set('connectedUsers', connectedUsers);

app.use(cors());
app.use(express.json()); 
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Montar rutas
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/publications', publicationRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/saved', savedRoutes);
app.use('/api/transactions', transactionRoutes);

app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'Servidor RE-USE funcionando con Postgres' });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});