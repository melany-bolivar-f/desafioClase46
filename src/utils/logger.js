const winston = require( 'winston')

//------------------------------------------------------------------------------------------------------------------
// Define opciones personalizadas para los niveles de registro y sus colores
const customLevelOptions = {
        levels: {
            fatal: 0,
            error: 1,
            warning: 2,
            info: 3,
            debug: 4
        },
        colors: {
            fatal: 'red',
            error: 'yellow',
            warning: 'yellow',
            info: 'blue',
            debug: 'white'
        }
}

// Crea un nuevo logger con configuraciones personalizadas
const logger = winston.createLogger({
    levels: customLevelOptions.levels,
    transports: [
        new winston.transports.Console({
            level:'info',
            format: winston.format.combine(
                winston.format.colorize({colors: customLevelOptions.colors}),
                winston.format.simple()
            )
        }),
        new winston.transports.File({
            filename: './errors.log',
            level: 'warning',
            format: winston.format.simple()
        })
    ]
})

// Middleware para añadir el logger a cada solicitud
const addLogger =(req, res, next ) => {
    req.logger = logger
    logger.info(`${req.method} Ruta: localhost:8080${req.url} - ${new Date().getDate}`)
    next();
}


module.exports = {
    addLogger,
    logger
}