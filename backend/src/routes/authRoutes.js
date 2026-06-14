const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// POST /api/auth/register
router.post('/register', authController.register);

// GET /api/auth/verify/:token
router.get('/verify/:token', authController.verify);

// POST /api/auth/login
router.post('/login', authController.login);

module.exports = router;