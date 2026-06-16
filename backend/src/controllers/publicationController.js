const db = require('../config/db');

exports.createPublication = async (req, res) => {
    // El ID del vendedor viene del token seguro
    const userId = req.user.id;
    const { titulo, descripcion, precio, estado, tipo_adquisicion, stock, id_categoria } = req.body;
    
    // Si multer procesó una imagen, guardamos la ruta. Si no, queda null.
    const fotoPath = req.file ? `/uploads/${req.file.filename}` : null;

    if (!titulo || !precio || !tipo_adquisicion || !id_categoria) {
        return res.status(400).json({ error: 'Faltan campos obligatorios para publicar.' });
    }

    try {
        const insertQuery = `
            INSERT INTO Producto (Titulo, Descripcion, Precio, Estado, Tipo_Adquisicion, Stock, Fotos, ID_Categoria, ID_Usuario)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *;
        `;
        const values = [titulo, descripcion, precio, estado || 'Disponible', tipo_adquisicion, stock || 1, fotoPath, id_categoria, userId];
        
        const result = await db.query(insertQuery, values);

        res.status(201).json({
            message: 'Componente publicado con éxito',
            articulo: result.rows[0]
        });

    } catch (error) {
        console.error('Error al crear publicación:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
};

exports.getPublications = async (req, res) => {
    // Extraer parámetros de búsqueda de la URL (Query Params)
    const { search, category, state, acquisitionType } = req.query;

    try {
        let query = `
            SELECT p.ID_Producto, p.Titulo, p.Descripcion, p.Precio, p.Estado, p.Tipo_Adquisicion, p.Fotos, p.Stock,
                   c.Nombre as Categoria, u.Nombre as Vendedor, u.Correo_Institucional,
                   COALESCE(r.Reputacion, 5.0) as Reputacion_Vendedor
            FROM Producto p
            JOIN Categoria c ON p.ID_Categoria = c.ID_Categoria
            JOIN Usuario u ON p.ID_Usuario = u.ID_Usuario
            LEFT JOIN (SELECT ID_Usuario, AVG(Estrellas) as Reputacion FROM Reputacion GROUP BY ID_Usuario) r ON u.ID_Usuario = r.ID_Usuario
            WHERE 1=1
        `;
        const values = [];
        let counter = 1;

        // Construcción dinámica de la consulta SQL para los filtros
        if (search) {
            query += ` AND (p.Titulo ILIKE $${counter} OR p.Descripcion ILIKE $${counter})`;
            values.push(`%${search}%`);
            counter++;
        }
        if (category) {
            // Filtrar por el nombre exacto de la categoría (ej. "Componentes")
            query += ` AND c.Nombre = $${counter}`;
            values.push(category);
            counter++;
        }
        if (state) {
            query += ` AND p.Estado = $${counter}`;
            values.push(state);
            counter++;
        }
        if (acquisitionType) {
            query += ` AND p.Tipo_Adquisicion = $${counter}`;
            values.push(acquisitionType);
            counter++;
        }

        query += ` ORDER BY p.Fecha_Publicacion DESC`;

        const result = await db.query(query, values);
        res.status(200).json(result.rows);

    } catch (error) {
        console.error('Error al listar publicaciones:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
};

exports.getMyPublications = async (req, res) => {
    const userId = req.user.id;
    try {
        const result = await db.query(
            `SELECT p.*, c.Nombre as Categoria 
             FROM Producto p 
             JOIN Categoria c ON p.ID_Categoria = c.ID_Categoria 
             WHERE p.ID_Usuario = $1 
             ORDER BY p.Fecha_Publicacion DESC`,
            [userId]
        );
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error al obtener mis publicaciones:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
};

exports.getPublicationById = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query(
            `SELECT p.*, c.Nombre as Categoria, u.Nombre as Vendedor, u.Correo_Institucional,
                    COALESCE(r.Reputacion, 5.0) as Reputacion_Vendedor
             FROM Producto p 
             JOIN Categoria c ON p.ID_Categoria = c.ID_Categoria 
             JOIN Usuario u ON p.ID_Usuario = u.ID_Usuario 
             LEFT JOIN (SELECT ID_Usuario, AVG(Estrellas) as Reputacion FROM Reputacion GROUP BY ID_Usuario) r ON u.ID_Usuario = r.ID_Usuario
             WHERE p.ID_Producto = $1`,
            [id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Publicación no encontrada.' });
        }
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Error al obtener publicación:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
};

exports.updatePublication = async (req, res) => {
    const userId = req.user.id;
    const { id } = req.params;
    const { titulo, descripcion, precio, estado, tipo_adquisicion, stock, id_categoria } = req.body;

    try {
        // 1. Verificar existencia y propiedad
        const checkOwner = await db.query('SELECT ID_Usuario FROM Producto WHERE ID_Producto = $1', [id]);
        if (checkOwner.rows.length === 0) return res.status(404).json({ error: 'Publicación no encontrada.' });
        if (checkOwner.rows[0].id_usuario !== userId) return res.status(403).json({ error: 'No tienes permiso para editar esta publicación.' });

        // 2. Actualizar datos usando COALESCE para no sobreescribir con nulos lo que no se envíe
        const updateQuery = `
            UPDATE Producto 
            SET Titulo = COALESCE($1, Titulo),
                Descripcion = COALESCE($2, Descripcion),
                Precio = COALESCE($3, Precio),
                Estado = COALESCE($4, Estado),
                Tipo_Adquisicion = COALESCE($5, Tipo_Adquisicion),
                Stock = COALESCE($6, Stock),
                ID_Categoria = COALESCE($7, ID_Categoria)
            WHERE ID_Producto = $8
            RETURNING *;
        `;
        const result = await db.query(updateQuery, [titulo, descripcion, precio, estado, tipo_adquisicion, stock, id_categoria, id]);
        
        res.status(200).json({ message: 'Publicación actualizada', articulo: result.rows[0] });
    } catch (error) {
        console.error('Error al actualizar publicación:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
};

exports.deletePublication = async (req, res) => {
    const userId = req.user.id;
    const { id } = req.params;

    try {
        const checkOwner = await db.query('SELECT ID_Usuario FROM Producto WHERE ID_Producto = $1', [id]);
        if (checkOwner.rows.length === 0) return res.status(404).json({ error: 'Publicación no encontrada.' });
        if (checkOwner.rows[0].id_usuario !== userId) return res.status(403).json({ error: 'No tienes permiso para eliminar esta publicación.' });

        await db.query('DELETE FROM Producto WHERE ID_Producto = $1', [id]);
        res.status(200).json({ message: 'Publicación eliminada correctamente' });
    } catch (error) {
        console.error('Error al eliminar publicación:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
};

exports.deletePublicationAsAdmin = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query('DELETE FROM Producto WHERE ID_Producto = $1 RETURNING ID_Producto', [id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Publicación no encontrada.' });
        res.status(200).json({ message: 'Publicación eliminada por violación a las normas comunitarias.' });
    } catch (error) {
        res.status(500).json({ error: 'Error del servidor.' });
    }
};