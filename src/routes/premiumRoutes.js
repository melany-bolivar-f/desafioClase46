const express = require('express');
const router = express.Router();
const User = require('../dao/models/users');
const multer = require('multer');
const path = require('path');
const mailService = require('../utils/mailService'); 
const { logger } = require('../utils/logger');


//-------------------------------------------------------------------------------------------------------------------
// Define las rutas relacionadas con los usuarios

// Ruta para obtener la lista de usuarios
router.get('/', async (req, res) => {
    try {
        const users = await User.find({}, { first_name: 1, email: 1, role: 1 }); 

        res.json(users);
    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        res.status(500).json({ message: 'Error interno del servidor al obtener usuarios' });
    }
});


router.delete('/', async (req, res) => {
    try {
        const dosDiasAtras = new Date();
        dosDiasAtras.setDate(dosDiasAtras.getDate() - 2);
        const dosDiasAtrasISO = dosDiasAtras.toISOString();
        console.log("esta es la fecha", dosDiasAtrasISO)
        const usuariosEliminados = await User.find({ last_connection: { $lt: dosDiasAtrasISO } }).select('email');
        const correosUsuariosEliminados = usuariosEliminados.map(usuario => usuario.email);
        await User.deleteMany({ last_connection: { $lt: dosDiasAtrasISO } });
        const subject = "Notificacion de eliminacion de cuenta por inactividad"
        for (const correo of correosUsuariosEliminados) {
            const message = `
                <html lang="es">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Notificación de eliminación de cuenta por inactividad</title>
                    <style>
                        /* Estilos CSS aquí */
                    </style>
                </head>
                <body>
                    <h1>Notificación de eliminación de cuenta por inactividad</h1>
                    <p>Hola,</p>
                    <p>Tu cuenta ha sido eliminada debido a la inactividad durante más de 2 días.</p>
                    <p>Si necesitas recuperar tu cuenta, por favor contáctanos.</p>
                    <p>Saludos,</p>
                    <p>Tu equipo</p>
                </body>
                </html>
            `;
            await mailService.sendNotificationEmail(correo, message, subject);
        }

        res.json({ message: 'Usuarios inactivos eliminados correctamente' });
    } catch (error) {
        console.error('Error al limpiar usuarios inactivos:', error);
        res.status(500).json({ message: 'Error interno del servidor al limpiar usuarios inactivos' });
    }
});

router.post('/premium/:uid', async (req, res) => {
    try {
        const userId = req.params.uid;

        const { newRole } = req.body;

        if (newRole !== 'admin' && newRole !== 'premium' && newRole !== "user") {
            return res.status(400).json({ status: 'error', message: 'Rol inválido' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ status: 'error', message: 'Usuario no encontrado' });
        }

        if (req.user.role !== 'admin') {
            const requiredDocuments = ['Documentacion', 'ConstanciaDireccion', 'ConstanciaCuenta'];
            const userDocuments = user.documents.map(doc => doc.name);
            const hasRequiredDocuments = requiredDocuments.every(doc => userDocuments.includes(doc));
            logger.info('Nombres de documentos del usuario:', userDocuments);
            logger.info('Documentos requeridos:', requiredDocuments);
            if (!hasRequiredDocuments) {
                return res.status(400).json({ status: 'error', message: 'El usuario no tiene los documentos necesarios para ser premium' });
            }
        }

        setTimeout(async () => {
            user.role = newRole;
            await user.save();

            return res.redirect("/userProfile")
        }, 1000); 
    } catch (error) {
        logger.error(error);
        return res.status(500).json({ status: 'error', message: 'Error interno del servidor' });
    }
});

router.get('/documents/:uid', async (req, res) => {
    try {
        const userId = req.params.uid;

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ status: 'error', message: 'Usuario no encontrado' });
        }

        const requiredDocuments = ['Documentacion', 'ConstanciaDireccion', 'ConstanciaCuenta'];
        const userDocuments = user.documents.map(doc => doc.name);

        // Verificar si el usuario tiene todos los documentos requeridos
        const hasRequiredDocuments = requiredDocuments.every(doc => userDocuments.includes(doc));

        if (!hasRequiredDocuments) {
            return res.status(400).json({ status: 'error', message: 'El usuario no tiene los documentos requeridos' });
        }

        return res.status(200).json({ status: 'success', documents: user.documents });

    } catch (error) {
        logger.error(error);
        return res.status(500).json({ status: 'error', message: 'Error interno del servidor' });
    }
});

router.get('/documents', (req, res) => {
    if (req.isAuthenticated()) {
        const userId = req.user._id;
        res.render('documents', { userId: userId });
    } else {
        res.redirect('/login');
    }
});

const checkDocumentLimit = async (req, res, next) => {
    try {
        const userId = req.params.uid;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ status: 'error', message: 'Usuario no encontrado' });
        }

        if (user.documents.length >= 3) {
            return res.status(400).json({ status: 'error', message: 'Se excede el límite de documentos permitidos (máximo 3)' });
        }

        next();
    } catch (error) {
        logger.error(error);
        return res.status(500).json({ status: 'error', message: 'Error interno del servidor' });
    }
};

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../uploads'))
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now())
    }
});

const upload = multer({ storage });

router.post('/:uid/documents', upload.array('documents', 3), async (req, res) => {
    try {
        const userId = req.params.uid;

        let user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ status: 'error', message: 'Usuario no encontrado' });
        }

        user.documents = [];

        req.files.forEach(file => {
            const fileNameWithoutExtension = file.originalname.split('.').slice(0, -1).join('.');
            user.documents.push({
                name: fileNameWithoutExtension,
                reference: file.path
            });
        });

        user = await user.save();

        return res.redirect('/userProfile');

    } catch (error) {
        logger.error(error);
        return res.status(500).json({ status: 'error', message: 'Error interno del servidor' });
    }
});

router.post('/delete-user/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const deletedUser = await User.findByIdAndDelete(userId);
        
        if (!deletedUser) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        const subject = 'Notificación de eliminación de cuenta';
        const message = `
            <html lang="es">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${subject}</title>
                <style>
                    /* Estilos CSS aquí */
                </style>
            </head>
            <body>
                <h1>${subject}</h1>
                <p>Hola ${deletedUser.first_name},</p>
                <p>Tu cuenta ha sido eliminada por un administrador.</p>
                <p>Si tienes alguna pregunta, contáctanos.</p>
                <p>Saludos,</p>
                <p>Tu equipo</p>
            </body>
            </html>
        `;
        await mailService.sendNotificationEmail(deletedUser.email, message, subject);
        
        res.redirect('/userEdit');
    } catch (error) {
        console.error('Error al eliminar usuario:', error);
        res.status(500).json({ message: 'Error interno del servidor al eliminar usuario' });
    }
});


module.exports = router;
