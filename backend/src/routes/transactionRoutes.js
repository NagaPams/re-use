const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const verifyToken = require('../middlewares/authMiddleware');

// POST /api/transactions
router.post('/', verifyToken, transactionController.closeTransaction);

module.exports = router;