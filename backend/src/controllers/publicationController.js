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
            SELECT p.ID_Producto, p.Titulo, p.Precio, p.Estado, p.Tipo_Adquisicion, p.Fotos, 
                   c.Nombre as Categoria, u.Nombre as Vendedor, u.Correo_Institucional 
            FROM Producto p
            JOIN Categoria c ON p.ID_Categoria = c.ID_Categoria
            JOIN Usuario u ON p.ID_Usuario = u.ID_Usuario
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