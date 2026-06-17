const db = require('../config/db');

exports.createChat = async (req, res) => {
    const userId = req.user.id; // El comprador
    const { articleId } = req.body;

    if (!articleId) {
        return res.status(400).json({ error: 'Falta el ID del artículo.' });
    }

    try {
        // 1. Verificar si el usuario intenta hacer chat consigo mismo
        const productCheck = await db.query('SELECT ID_Usuario FROM Producto WHERE ID_Producto = $1', [articleId]);
        if (productCheck.rows.length === 0) return res.status(404).json({ error: 'Artículo no encontrado.' });
        if (productCheck.rows[0].id_usuario === userId) return res.status(400).json({ error: 'No puedes iniciar un chat contigo mismo.' });

        // 2. Verificar si el chat ya existe
        const chatExistente = await db.query(
            'SELECT ID_Chat FROM Chat WHERE ID_Usuario_Inicia = $1 AND ID_Producto = $2',
            [userId, articleId]
        );

        if (chatExistente.rows.length > 0) {
            return res.status(200).json({ chatId: chatExistente.rows[0].id_chat });
        }

        // 3. Crear el nuevo chat
        const result = await db.query(
            'INSERT INTO Chat (ID_Usuario_Inicia, ID_Producto) VALUES ($1, $2) RETURNING ID_Chat',
            [userId, articleId]
        );

        res.status(201).json({ chatId: result.rows[0].id_chat });

    } catch (error) {
        console.error('Error al crear chat:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
};

exports.sendMessage = async (req, res) => {
    const senderId = req.user.id;
    const { chatId } = req.params;
    const { text } = req.body; // MVP: Solo texto, omitimos los campos fileUrl de la documentación.

    if (!text) {
        return res.status(400).json({ error: 'El mensaje no puede estar vacío.' });
    }

    try {
        // 1. Verificar que el chat existe y determinar quién es el destinatario
        const chatInfo = await db.query(`
            SELECT c.ID_Usuario_Inicia, p.ID_Usuario AS ID_Vendedor 
            FROM Chat c
            JOIN Producto p ON c.ID_Producto = p.ID_Producto
            WHERE c.ID_Chat = $1
        `, [chatId]);

        if (chatInfo.rows.length === 0) return res.status(404).json({ error: 'Chat no encontrado.' });

        const { id_usuario_inicia, id_vendedor } = chatInfo.rows[0];
        
        // Validación de seguridad: Solo comprador o vendedor pueden enviar mensajes
        if (senderId !== id_usuario_inicia && senderId !== id_vendedor) {
            return res.status(403).json({ error: 'No tienes permiso para participar en este chat.' });
        }

        // El destinatario es la otra parte
        const receiverId = senderId === id_usuario_inicia ? id_vendedor : id_usuario_inicia;

        // 2. Persistir el mensaje en la Base de Datos (Transacción ACID)
        const insertMsg = await db.query(
            'INSERT INTO Mensaje (Texto, ID_Chat, ID_Usuario_Emisor) VALUES ($1, $2, $3) RETURNING ID_Mensaje, Texto, Marca_de_tiempo',
            [text, chatId, senderId]
        );

        const newMessage = insertMsg.rows[0];

        // 3. Recuperar instancias de Socket.io desde Express
        const io = req.app.get('io');
        const connectedUsers = req.app.get('connectedUsers');
        
        // 4. Emitir el evento en tiempo real si el destinatario está conectado
        const receiverSocketId = connectedUsers.get(receiverId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit('nuevo_mensaje', {
                chatId: chatId,
                senderId: senderId,
                text: newMessage.texto,
                time: newMessage.marca_de_tiempo
            });
        }

        res.status(201).json({
            sender: "me",
            text: newMessage.texto,
            time: newMessage.marca_de_tiempo
        });

    } catch (error) {
        console.error('Error al enviar mensaje:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
};

exports.getUserChats = async (req, res) => {
    const userId = req.user.id;

    try {
        // 1. Obtener todos los chats donde el usuario participa
        const chatsQuery = `
            SELECT 
                c.ID_Chat, 
                p.ID_Producto, 
                p.Titulo AS articleTitle,
                c.ID_Usuario_Inicia AS comprador_id,
                p.ID_Usuario AS vendedor_id,
                u_comp.Nombre AS comprador_nombre,
                u_comp.Apellido_Paterno AS comprador_apellido,
                u_vend.Nombre AS vendedor_nombre,
                u_vend.Apellido_Paterno AS vendedor_apellido
            FROM Chat c
            JOIN Producto p ON c.ID_Producto = p.ID_Producto
            JOIN Usuario u_comp ON c.ID_Usuario_Inicia = u_comp.ID_Usuario
            JOIN Usuario u_vend ON p.ID_Usuario = u_vend.ID_Usuario
            WHERE c.ID_Usuario_Inicia = $1 OR p.ID_Usuario = $1
            ORDER BY c.ID_Chat DESC;
        `;
        const chatsResult = await db.query(chatsQuery, [userId]);
        const chats = [];

        // 2. Iterar y formatear según el rol (RF8)
        for (let row of chatsResult.rows) {
            const isComprador = (userId === row.comprador_id);
            
            const partnerName = isComprador 
                ? `${row.vendedor_nombre} ${row.vendedor_apellido}`
                : `${row.comprador_nombre} ${row.comprador_apellido}`;
            const partnerRole = isComprador ? 'Vendedor' : 'Cliente';

            // 3. Obtener el historial de mensajes
            const msgQuery = `
                SELECT Texto, Marca_de_tiempo, ID_Usuario_Emisor
                FROM Mensaje
                WHERE ID_Chat = $1
                ORDER BY Marca_de_tiempo ASC
            `;
            const msgResult = await db.query(msgQuery, [row.id_chat]);

            const messages = msgResult.rows.map(m => ({
                sender: m.id_usuario_emisor === userId ? 'me' : 'partner',
                text: m.texto,
                time: m.marca_de_tiempo,
                fileType: null, // Mantenemos null por restricción del MVP
                fileUrl: null,
                fileName: null
            }));

            chats.push({
                id: `chat_${row.id_chat}`,
                articleId: row.id_producto.toString(),
                articleTitle: row.articletitle,
                partnerName: partnerName,
                partnerRole: partnerRole,
                messages: messages
            });
        }

        res.status(200).json(chats);

    } catch (error) {
        console.error('Error al obtener bandeja de chats:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
};