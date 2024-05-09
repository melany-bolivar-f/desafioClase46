const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

//------------------------------------------------------------------------------------------------------------------
// Define las opciones de configuración para Swagger
const options = {
    swaggerDefinition: {
        openapi: '3.0.1',
        info: {
            title: 'API Documentation',
            version: '1.0.0',
            description: 'Documentación de la API de tu proyecto final',
        },
    },
    apis: ['../docs/Users/Users.yaml'], 
};

// Genera la especificación de Swagger
const specs = swaggerJsdoc(options);

// Exporta un middleware para servir la documentación de Swagger
module.exports = function(app) {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
};