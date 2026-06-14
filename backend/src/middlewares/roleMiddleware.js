const verifyModerator = (req, res, next) => {
    // req.user ya fue decodificado previamente por authMiddleware
    if (req.user.rol !== 'Moderador') {
        return res.status(403).json({ error: 'Acceso denegado. Operación exclusiva para Moderadores.' });
    }
    next();
};

module.exports = verifyModerator;