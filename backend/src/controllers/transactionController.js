const db = require('../config/db');

exports.closeTransaction = async (req, res) => {
    const compradorId = req.user.id;
    const { articleId, precioAcordado, estrellas, comentario } = req.body;

    try {
        // 1. Validar el producto y obtener al vendedor
        const producto = await db.query('SELECT ID_Usuario, Tipo_Adquisicion, Estado FROM Producto WHERE ID_Producto = $1', [articleId]);
        if (producto.rows.length === 0) return res.status(404).json({ error: 'Producto no encontrado.' });
        if (producto.rows[0].estado !== 'Disponible') return res.status(400).json({ error: 'El producto ya no está disponible.' });
        
        const vendedorId = producto.rows[0].id_usuario;
        const tipoAdquisicion = producto.rows[0].tipo_adquisicion;

        // Iniciar transacción SQL para garantizar atomicidad
        await db.query('BEGIN');

        // 2. Registrar Transacción
        await db.query(
            'INSERT INTO Transaccion (ID_Producto, ID_Comprador, Tipo_Transaccion, Precio_Acordado) VALUES ($1, $2, $3, $4)',
            [articleId, compradorId, tipoAdquisicion, precioAcordado || 0]
        );

        // 3. Cambiar estado del producto
        await db.query('UPDATE Producto SET Estado = $1 WHERE ID_Producto = $2', [tipoAdquisicion === 'Venta' ? 'Vendido' : 'Entregado', articleId]);

        // 4. Asignar reputación al vendedor
        if (estrellas && estrellas >= 1 && estrellas <= 5) {
            await db.query(
                'INSERT INTO Reputacion (Estrellas, Comentario, ID_Usuario) VALUES ($1, $2, $3)',
                [estrellas, comentario || '', vendedorId]
            );
        }

        await db.query('COMMIT');
        res.status(200).json({ message: 'Transacción cerrada exitosamente. Producto marcado como no disponible.' });

    } catch (error) {
        await db.query('ROLLBACK');
        console.error('Error en transacción:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
};