const passport = require('passport');
const bcrypt = require('bcrypt');
const User = require('../dao/models/users');
const { initializePassportGitHub, initializePassportLocal } = require('../config/passport.config')
const {logger} = require("../utils/logger")

//------------------------------------------------------------------------------------------------------------------
initializePassportLocal()
initializePassportGitHub()


passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (error) {
        done(error);
    }
});

const sessionController = {
    register: (req, res, next) => {
        passport.authenticate('local.register', (err, user, info) => {
            if (err) {
                return res.status(500).json({ message: 'Error interno del servidor' });
            }
            if (!user) {
                return res.status(400).json({ message: info || 'Error al registrar usuario' });
            }
            req.login(user, (err) => {
                if (err) {
                    return res.status(500).json({ message: 'Error interno del servidor' });
                }
                return res.status(201).json({ message: 'Usuario registrado exitosamente', user });
            });
        })(req, res, next);
    },

    login: (req, res, next) => {
        passport.authenticate('local.login', (err, user, info) => {
            if (err) {
                return res.status(500).json({ message: 'Error interno del servidor' });
            }
            if (!user) {
                return res.status(401).json({ message: info || 'Credenciales inválidas' });
            }
            req.login(user, (err) => {
                if (err) {
                    return res.status(500).json({ message: 'Error interno del servidor' });
                }
                return res.status(200).json({ message: 'Inicio de sesión exitoso', user });
            });
        })(req, res, next);
    },

    githubLogin: (req, res, next) => {
        passport.authenticate('github', { scope: ['user:email'] })(req, res, next);
    },

    githubCallback: (req, res, next) => {
        passport.authenticate('github', { failureRedirect: '/login' })(req, res, next);
    },

    logout: (req, res, next) => {
        try {
            req.logout();
            res.status(200).json({ message: 'Sesión cerrada exitosamente' });
        } catch (error) {
            logger.error('Error al cerrar sesión:', error);
            res.status(500).json({ message: 'Error interno del servidor' });
        }
    },

    getCurrentUser: (req, res, next) => {
        try {
            const user = req.user;
            if (!user) {
                return res.status(401).json({ message: 'Usuario no autenticado' });
            }
            res.status(200).json({ user });
        } catch (error) {
            logger.error('Error al obtener usuario actual:', error);
            res.status(500).json({ message: 'Error interno del servidor' });
        }
    }
};

module.exports = sessionController;