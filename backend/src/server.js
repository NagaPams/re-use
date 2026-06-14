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

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST", "PUT", "DELETE"] }
});

app.use(cors());
app.use(express.json()); 
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Montar rutas
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/publications', publicationRoutes);

app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'Servidor RE-USE funcionando con Postgres' });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});