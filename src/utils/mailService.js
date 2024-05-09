const nodemailer = require('nodemailer');
const User = require('../dao/models/users');
const {logger} = require("../utils/logger")

//------------------------------------------------------------------------------------------------------------------
// Envia un correo electrónico para restablecer la contraseña del usuario
async function sendPasswordResetEmail(email, token) {
    try {
        const user = await User.findOne({ email });

        if (!user) {
            throw new Error('Usuario no encontrado');
        }

        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; 
        await user.save();

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'juanfraa032@gmail.com',
                pass: 'uoma cair nlvx uxrs'
            }
        });

        const mailOptions = {
            from: 'somosprueba@gmail.com',
            to: email,
            subject: 'Restablecer contraseña',
            html: `
                <html lang="es">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Restablecer Contraseña</title>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            line-height: 1.6;
                            margin: 0;
                            padding: 0;
                            background-color: #f4f4f4;
                        }
                        .container {
                            max-width: 600px;
                            margin: 20px auto;
                            padding: 20px;
                            background-color: #fff;
                            border-radius: 10px;
                            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
                        }
                        h1 {
                            color: #333;
                        }
                        p {
                            color: #555;
                        }
                        a {
                            color: #007bff;
                            text-decoration: none;
                        }
                        .button {
                            display: inline-block;
                            padding: 10px 20px;
                            background-color: rgb(103, 228, 147);
                            color: black;
                            border: none;
                            border-radius: 5px;
                            text-decoration: none;
                            font-size: 16px;
                            cursor: pointer;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>Restablecer Contraseña</h1>
                        <p>Hola,</p>
                        <p>Haz clic en el siguiente enlace para restablecer tu contraseña:</p>
                        <p><a class="button" href="https://preentrega-backend-production.up.railway.app/api/sessions/reset-password/${token}">Restablecer Contraseña</a></p>
                        <p>Si no solicitaste restablecer tu contraseña, ignora este correo.</p>
                        <p>Saludos,</p>
                        <p>Tu equipo</p>
                    </div>
                </body>
                </html>
            `
        };

        await transporter.sendMail(mailOptions);
    } catch (error) {
        logger.error('Error al enviar el correo electrónico de restablecimiento de contraseña:', error);
        throw error;
    }
}

// Envia un correo electrónico de notificación
async function sendNotificationEmail(email, message, subject) {
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'melany.bolivar.f@gmail.com', 
                pass: 'uoma cair nlvx uxrs' 
            }
        });

        const mailOptions = {
            from: 'melany.bolivar.f@gmail.com', 
            to: email,
            subject: subject,
            html: message 
        };

        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error('Error al enviar la notificación por correo electrónico:', error);
        throw error;
    }
}


module.exports = {
    sendPasswordResetEmail,
    sendNotificationEmail 
};