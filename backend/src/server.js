const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // En producción, cambiar por la URL de tu frontend
        methods: ["GET", "POST", "PUT", "DELETE"]
    }
});

// Middlewares
app.use(cors());
app.use(express.json()); // Para parsear application/json

// Ruta de prueba
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'Servidor RE-USE funcionando' });
});

// Configuración básica de WebSockets
io.on('connection', (socket) => {
    console.log(`Usuario conectado: ${socket.id}`);
    socket.on('disconnect', () => {
        console.log(`Usuario desconectado: ${socket.id}`);
    });
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});