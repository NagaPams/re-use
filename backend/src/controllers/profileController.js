const bcrypt = require('bcrypt');
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
        // Nuevo query: Calcular el promedio real
        const repResult = await db.query('SELECT AVG(Estrellas) as promedio FROM Reputacion WHERE ID_Usuario = $1', [userId]);
        const reputacionReal = repResult.rows[0].promedio ? parseFloat(repResult.rows[0].promedio).toFixed(1) : 0;

        // Simulamos la reputación y el avatar
        res.status(200).json({
            id: user.id_usuario,
            nombre: user.nombre,
            apellidos: `${user.apellido_paterno} ${user.apellido_materno}`,
            correo: user.correo_institucional,
            telefono: user.telefono,
            fecha_registro: user.fecha_registro,
            reputacion: reputacionReal, // <- Ahora es un dato matemático real de la BD
            avatarUrl: null  // Pendiente: Implementar carga de imágenes
        });

    } catch (error) {
        console.error('Error al obtener el perfil:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
};
exports.updateProfile = async (req, res) => {
    const userId = req.user.id;
    // Adaptado a tu esquema SQL actual
    const { nombre, apellido_paterno, apellido_materno, telefono } = req.body;

    try {
        const updateQuery = `
            UPDATE Usuario 
            SET Nombre = COALESCE($1, Nombre),
                Apellido_Paterno = COALESCE($2, Apellido_Paterno),
                Apellido_Materno = COALESCE($3, Apellido_Materno),
                Telefono = COALESCE($4, Telefono)
            WHERE ID_Usuario = $5
            RETURNING ID_Usuario, Nombre, Apellido_Paterno, Apellido_Materno, Correo_Institucional, Telefono;
        `;
        
        const result = await db.query(updateQuery, [nombre, apellido_paterno, apellido_materno, telefono, userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado.' });
        }

        const updatedUser = result.rows[0];

        res.status(200).json({
            message: 'Perfil actualizado exitosamente',
            user: {
                id: updatedUser.id_usuario,
                nombre: updatedUser.nombre,
                apellidos: `${updatedUser.apellido_paterno} ${updatedUser.apellido_materno}`,
                correo: updatedUser.correo_institucional,
                telefono: updatedUser.telefono
            }
        });

    } catch (error) {
        console.error('Error al actualizar el perfil:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
};

exports.updatePassword = async (req, res) => {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Debes proporcionar la contraseña actual y la nueva.' });
    }

    try {
        // 1. Obtener la contraseña actual hasheada
        const result = await db.query('SELECT Contrasena FROM Usuario WHERE ID_Usuario = $1', [userId]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado.' });
        }

        const user = result.rows[0];

        // 2. Verificar que la contraseña actual ingresada sea correcta
        const isValidPassword = await bcrypt.compare(currentPassword, user.contrasena);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'La contraseña actual es incorrecta.' });
        }

        // 3. Hashear la nueva contraseña
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // 4. Actualizar en la base de datos
        await db.query('UPDATE Usuario SET Contrasena = $1 WHERE ID_Usuario = $2', [hashedPassword, userId]);

        res.status(200).json({ message: 'Contraseña actualizada exitosamente.' });

    } catch (error) {
        console.error('Error al actualizar la contraseña:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
};

exports.updateAvatar = async (req, res) => {
    const userId = req.user.id;
    const avatarPath = req.file ? `/uploads/${req.file.filename}` : null;

    if (!avatarPath) return res.status(400).json({ error: 'No se subió ninguna imagen.' });

    try {
        await db.query('UPDATE Usuario SET AvatarUrl = $1 WHERE ID_Usuario = $2', [avatarPath, userId]);
        res.status(200).json({ avatarUrl: avatarPath });
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar el avatar.' });
    }
};