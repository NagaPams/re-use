const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const publicationController = require('../controllers/publicationController');
const verifyToken = require('../middlewares/authMiddleware');
const verifyModerator = require('../middlewares/roleMiddleware');
const upload = require('../middlewares/uploadMiddleware');

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


// Rutas
// GET /api/publications (Pública, cualquiera puede ver el catálogo)
router.get('/', publicationController.getPublications);

// POST /api/publications (Protegida, solo usuarios verificados pueden publicar)
router.post('/', verifyToken, upload.array('imagenes', 10), publicationController.createPublication);

// Mis publicaciones 
router.get('/my', verifyToken, publicationController.getMyPublications);

// Detalle, actualización y eliminación
router.get('/:id', publicationController.getPublicationById);
router.put('/:id', verifyToken, upload.array('imagenes', 10), publicationController.updatePublication);
router.delete('/:id', verifyToken, publicationController.deletePublication);
// DELETE /api/publications/admin/:id
router.delete('/admin/:id', verifyToken, verifyModerator, publicationController.deletePublicationAsAdmin);

module.exports = router;