const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

exports.register = async (req, res) => {
    const { nombre, apellido_paterno, apellido_materno, correo, contrasena, boleta } = req.body;

    // 1. Validación estricta del dominio institucional
    if (!correo || !correo.endsWith('@alumno.ipn.mx')) {
        return res.status(400).json({ error: 'Validación fallida: Solo se permiten correos @alumno.ipn.mx.' });
    }

    try {
        // 2. Verificar si el usuario ya existe por correo o boleta por separado
        const emailCheck = await db.query('SELECT * FROM Usuario WHERE Correo_Institucional = $1', [correo]);
        const boletaCheck = boleta ? await db.query('SELECT * FROM Usuario WHERE Boleta = $1', [boleta]) : { rows: [] };

        if (emailCheck.rows.length > 0 && boletaCheck.rows.length > 0) {
            return res.status(400).json({ 
                error: 'El correo electrónico y la boleta ya están registrados.',
                emailExists: true,
                boletaExists: true
            });
        }
        if (emailCheck.rows.length > 0) {
            return res.status(400).json({ 
                error: 'El correo ya está registrado.',
                emailExists: true,
                boletaExists: false
            });
        }
        if (boletaCheck.rows.length > 0) {
            return res.status(400).json({ 
                error: 'La boleta ya está registrada.',
                emailExists: false,
                boletaExists: true
            });
        }

        // 3. Hashear la contraseña (Factor de costo: 10)
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(contrasena, salt);

        // 4. Insertar en PostgreSQL (usando RETURNING para obtener el ID generado)
        const insertQuery = `
            INSERT INTO Usuario (Nombre, Apellido_Paterno, Apellido_Materno, Correo_Institucional, Contrasena, Boleta)
            VALUES ($1, $2, $3, $4, $5, $6) RETURNING ID_Usuario;
        `;
        const result = await db.query(insertQuery, [nombre, apellido_paterno, apellido_materno, correo, hashedPassword, boleta]);
        const newUserId = result.rows[0].id_usuario;

        // 5. Simular el envío de correo (MVP)
        const verifyToken = jwt.sign({ id: newUserId }, process.env.JWT_SECRET, { expiresIn: '1h' });
        
        // En producción, aquí va Nodemailer. Por ahora, lo imprimimos en consola.
        console.log(`[MVP SIMULACIÓN EMAIL] Enlace de validación para ${correo}: http://localhost:3000/api/auth/verify/${verifyToken}`);

        // Respuesta 202 Accepted según nuestra corrección arquitectónica
        res.status(202).json({ 
            message: 'Registro exitoso. Revisa tu consola para ver el enlace de activación.' 
        });

    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({ error: 'Error interno del servidor al registrar el usuario.' });
    }
};

exports.verify = async (req, res) => {
    const { token } = req.params;

    if (!token) {
        return res.status(400).json({ error: 'Falta el token de verificación.' });
    }

    try {
        // 1. Decodificar y verificar la firma del token temporal
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;

        // 2. Actualizar el estado del usuario a verificado
        const updateQuery = `
            UPDATE Usuario 
            SET Validacion = TRUE 
            WHERE ID_Usuario = $1 
            RETURNING ID_Usuario;
        `;
        const result = await db.query(updateQuery, [userId]);

        // Si el token es válido pero el usuario ya no existe en la BD
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado.' });
        }

        // 3. Confirmación exitosa
        res.status(200).json({ 
            message: 'Cuenta verificada exitosamente. Ya puedes iniciar sesión.' 
        });

    } catch (error) {
        console.error('Error en verificación:', error);
        // jwt.verify arroja error si el token expiró o fue manipulado
        res.status(400).json({ error: 'Token inválido o expirado. Solicita un nuevo enlace.' });
    }
};

exports.login = async (req, res) => {
    const { correo, contrasena } = req.body;

    // Validación básica de entrada
    if (!correo || !contrasena) {
        return res.status(400).json({ error: 'Por favor, proporciona correo y contraseña.' });
    }

    try {
        // 1. Buscar al usuario en la base de datos
        const result = await db.query('SELECT * FROM Usuario WHERE Correo_Institucional = $1', [correo]);
        const user = result.rows[0];

        // Si no existe, devolvemos 401 (Unauthorized) con un mensaje genérico por seguridad
        if (!user) {
            return res.status(401).json({ error: 'Credenciales incorrectas.' });
        }

        // 2. Verificar que la cuenta esté validada (RF1)
        if (!user.validacion) {
            return res.status(403).json({ error: 'Tu cuenta aún no está verificada. Revisa tu correo institucional.' });
        }

        // 3. Comparar la contraseña ingresada con el hash guardado en PostgreSQL
        const isValidPassword = await bcrypt.compare(contrasena, user.contrasena);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Credenciales incorrectas.' });
        }

        // 4. Generar el JWT de acceso principal (Sesión)
        const token = jwt.sign(
            { id: user.id_usuario, correo: user.correo_institucional, rol: user.rol },
            process.env.JWT_SECRET, 
            { expiresIn: '7d' }
        );

        // 5. Responder con el token y los datos del perfil (excluyendo datos sensibles)
        res.status(200).json({
            token,
            user: {
                id: user.id_usuario,
                nombre: user.nombre,
                apellidos: `${user.apellido_paterno} ${user.apellido_materno}`,
                correo: user.correo_institucional,
                telefono: user.telefono,
                boleta: user.boleta,
                avatarUrl: user.avatarurl
            }
        });

    } catch (error) {
        console.error('Error en el login:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
};