const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    // 1. Extraer la cabecera de autorización
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
        return res.status(403).json({ error: 'Acceso denegado. No se proporcionó un token.' });
    }

    // 2. El formato estándar es "Bearer <TOKEN>". Separamos la cadena.
    const token = authHeader.split(' ')[1];

    if (!token) {
        return res.status(403).json({ error: 'Acceso denegado. Formato de token inválido.' });
    }

    try {
        // 3. Verificar el token usando la llave secreta
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // 4. Inyectar los datos decodificados en el objeto 'req' para que el controlador los use
        req.user = decoded;
        
        // 5. Permitir que la petición continúe hacia el controlador
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Token inválido o expirado.' });
    }
};

module.exports = verifyToken;