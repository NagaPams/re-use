const nodemailer = require('nodemailer');

// Initialize transporter only if credentials exist in environment variables
const createTransporter = () => {
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!user || !pass || user.includes('tu_correo') || pass.includes('tu_contrasena')) {
        return null;
    }

    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: user,
            pass: pass
        }
    });
};

/**
 * Send account verification email
 * @param {string} to - Recipient email
 * @param {string} name - Recipient name
 * @param {string} link - Activation link
 */
exports.sendVerificationEmail = async (to, name, link) => {
    const transporter = createTransporter();
    if (!transporter) return;

    const fromAddress = process.env.SMTP_FROM || `"RE-USE" <${process.env.SMTP_USER}>`;

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Valida tu Cuenta | RE-USE</title>
        <style>
            body {
                font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
                background-color: #f8fafc;
                margin: 0;
                padding: 0;
                -webkit-font-smoothing: antialiased;
            }
            .email-container {
                max-width: 600px;
                margin: 40px auto;
                background-color: #ffffff;
                border-radius: 12px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
                overflow: hidden;
                border: 1px solid #e2e8f0;
            }
            .email-header {
                background-color: #003366;
                padding: 30px;
                text-align: center;
            }
            .email-header h1 {
                color: #ffffff;
                margin: 0;
                font-size: 28px;
                font-weight: 800;
                letter-spacing: 1.5px;
            }
            .email-body {
                padding: 40px 30px;
                color: #334155;
                line-height: 1.6;
            }
            .email-body h2 {
                color: #003366;
                font-size: 22px;
                margin-top: 0;
                margin-bottom: 20px;
                font-weight: 700;
            }
            .email-body p {
                font-size: 16px;
                margin-bottom: 24px;
                color: #475569;
            }
            .btn-container {
                text-align: center;
                margin: 35px 0;
            }
            .btn-accent {
                background-color: #0a888a;
                color: #ffffff !important;
                padding: 14px 28px;
                font-size: 16px;
                font-weight: bold;
                text-decoration: none;
                border-radius: 8px;
                display: inline-block;
                box-shadow: 0 4px 10px rgba(10, 136, 138, 0.25);
                transition: background-color 0.2s ease;
            }
            .btn-accent:hover {
                background-color: #086e70;
            }
            .email-footer {
                background-color: #f1f5f9;
                padding: 20px 30px;
                text-align: center;
                font-size: 12px;
                color: #64748b;
                border-top: 1px solid #e2e8f0;
            }
            .email-footer a {
                color: #0a888a;
                text-decoration: none;
            }
        </style>
    </head>
    <body>
        <div class="email-container">
            <div class="email-header">
                <h1>RE-USE</h1>
            </div>
            <div class="email-body">
                <h2>¡Hola, ${name}!</h2>
                <p>Gracias por unirte a la comunidad de <strong>RE-USE</strong> de ESCOM. Para completar el registro de tu cuenta y empezar a publicar, comprar, vender o regalar componentes electrónicos, por favor valida tu correo institucional haciendo clic en el botón de abajo:</p>
                <div class="btn-container">
                    <a href="${link}" class="btn-accent" target="_blank">Verificar Cuenta</a>
                </div>
                <p>Este enlace es válido por 1 hora. Si el botón no funciona, puedes copiar y pegar el siguiente enlace en tu navegador:</p>
                <p style="word-break: break-all; font-size: 14px; color: #64748b; background-color: #f8fafc; padding: 12px; border-radius: 6px; border: 1px solid #cbd5e1;">${link}</p>
            </div>
            <div class="email-footer">
                <p>Si no te registraste en RE-USE, puedes ignorar este correo de forma segura.</p>
                <p>&copy; 2026 RE-USE. Desarrollado para ESCOM.</p>
            </div>
        </div>
    </body>
    </html>
    `;

    try {
        await transporter.sendMail({
            from: fromAddress,
            to: to,
            subject: 'Valida tu Cuenta | RE-USE',
            html: htmlContent
        });
        console.log(`[EMAIL SERVICE] Correo de verificación enviado con éxito a ${to}`);
    } catch (error) {
        console.error(`[EMAIL SERVICE] Error al enviar correo de verificación a ${to}:`, error);
    }
};

/**
 * Send password reset email
 * @param {string} to - Recipient email
 * @param {string} name - Recipient name
 * @param {string} link - Reset link
 */
exports.sendPasswordResetEmail = async (to, name, link) => {
    const transporter = createTransporter();
    if (!transporter) return;

    const fromAddress = process.env.SMTP_FROM || `"RE-USE" <${process.env.SMTP_USER}>`;

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Recupera tu Contraseña | RE-USE</title>
        <style>
            body {
                font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
                background-color: #f8fafc;
                margin: 0;
                padding: 0;
                -webkit-font-smoothing: antialiased;
            }
            .email-container {
                max-width: 600px;
                margin: 40px auto;
                background-color: #ffffff;
                border-radius: 12px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
                overflow: hidden;
                border: 1px solid #e2e8f0;
            }
            .email-header {
                background-color: #003366;
                padding: 30px;
                text-align: center;
            }
            .email-header h1 {
                color: #ffffff;
                margin: 0;
                font-size: 28px;
                font-weight: 800;
                letter-spacing: 1.5px;
            }
            .email-body {
                padding: 40px 30px;
                color: #334155;
                line-height: 1.6;
            }
            .email-body h2 {
                color: #003366;
                font-size: 22px;
                margin-top: 0;
                margin-bottom: 20px;
                font-weight: 700;
            }
            .email-body p {
                font-size: 16px;
                margin-bottom: 24px;
                color: #475569;
            }
            .btn-container {
                text-align: center;
                margin: 35px 0;
            }
            .btn-accent {
                background-color: #0a888a;
                color: #ffffff !important;
                padding: 14px 28px;
                font-size: 16px;
                font-weight: bold;
                text-decoration: none;
                border-radius: 8px;
                display: inline-block;
                box-shadow: 0 4px 10px rgba(10, 136, 138, 0.25);
                transition: background-color 0.2s ease;
            }
            .btn-accent:hover {
                background-color: #086e70;
            }
            .email-footer {
                background-color: #f1f5f9;
                padding: 20px 30px;
                text-align: center;
                font-size: 12px;
                color: #64748b;
                border-top: 1px solid #e2e8f0;
            }
            .email-footer a {
                color: #0a888a;
                text-decoration: none;
            }
        </style>
    </head>
    <body>
        <div class="email-container">
            <div class="email-header">
                <h1>RE-USE</h1>
            </div>
            <div class="email-body">
                <h2>¡Hola, ${name}!</h2>
                <p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en <strong>RE-USE</strong>. Si fuiste tú, por favor haz clic en el siguiente botón para definir una nueva contraseña:</p>
                <div class="btn-container">
                    <a href="${link}" class="btn-accent" target="_blank">Restablecer Contraseña</a>
                </div>
                <p>Este enlace es válido por 15 minutos. Si el botón no funciona, puedes copiar y pegar el siguiente enlace en tu navegador:</p>
                <p style="word-break: break-all; font-size: 14px; color: #64748b; background-color: #f8fafc; padding: 12px; border-radius: 6px; border: 1px solid #cbd5e1;">${link}</p>
            </div>
            <div class="email-footer">
                <p>Si no solicitaste este restablecimiento, puedes ignorar este correo de forma segura. Tu contraseña actual seguirá siendo la misma.</p>
                <p>&copy; 2026 RE-USE. Desarrollado para ESCOM.</p>
            </div>
        </div>
    </body>
    </html>
    `;

    try {
        await transporter.sendMail({
            from: fromAddress,
            to: to,
            subject: 'Recuperar Contraseña | RE-USE',
            html: htmlContent
        });
        console.log(`[EMAIL SERVICE] Correo de recuperación enviado con éxito a ${to}`);
    } catch (error) {
        console.error(`[EMAIL SERVICE] Error al enviar correo de recuperación a ${to}:`, error);
    }
};
