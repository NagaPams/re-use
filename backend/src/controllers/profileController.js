const db = require('../config/db');

exports.getProfile = async (req, res) => {
    // El ID viene del token decodificado por el middleware, no del body ni la URL.
    // Esto hace que sea imposible falsificar la identidad consultada.
    const userId = req.user.id;

    try {
        const result = await db.query(
            'SELECT ID_Usuario, Nombre, Apellido_Paterno, Apellido_Materno, Correo_Institucional, Telefono, Fecha_Registro FROM Usuario WHERE ID_Usuario = $1', 
            [userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado.' });
        }

        const user = result.rows[0];

        // Simulamos la reputación y el avatar como indica tu documento de endpoints
        res.status(200).json({
            id: user.id_usuario,
            nombre: user.nombre,
            apellidos: `${user.apellido_paterno} ${user.apellido_materno}`,
            correo: user.correo_institucional,
            telefono: user.telefono,
            fecha_registro: user.fecha_registro,
            reputacion: 5.0, // Pendiente: Calcular desde la tabla Reputacion
            avatarUrl: null  // Pendiente: Implementar carga de imágenes
        });

    } catch (error) {
        console.error('Error al obtener el perfil:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
};