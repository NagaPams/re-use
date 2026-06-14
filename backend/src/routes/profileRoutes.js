const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const verifyToken = require('../middlewares/authMiddleware');

// GET /api/profile -> ¡Ruta Protegida!
router.get('/', verifyToken, profileController.getProfile);

module.exports = router;