const Handlebars = require('handlebars');

//------------------------------------------------------------------------------------------------------------------
// Registra un nuevo helper llamado 'multiply'
Handlebars.registerHelper('multiply', function (a, b) {
    // Devuelve el resultado de multiplicar los argumentos 'a' y 'b'
    return a * b;
});

module.exports = Handlebars;
