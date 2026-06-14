const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const publicationController = require('../controllers/publicationController');
const verifyToken = require('../middlewares/authMiddleware');

// Configuración de almacenamiento local para las imágenes
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Carpeta donde se guardarán
    },
    filename: function (req, file, cb) {
        // Renombramos el archivo con la fecha actual para evitar duplicados
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Rutas
// GET /api/publications (Pública, cualquiera puede ver el catálogo)
router.get('/', publicationController.getPublications);

// POST /api/publications (Protegida, solo usuarios verificados pueden publicar)
// 'imagen' es el nombre del campo en el formulario multipart
router.post('/', verifyToken, upload.single('imagen'), publicationController.createPublication);

module.exports = router;