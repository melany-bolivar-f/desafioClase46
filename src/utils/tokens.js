const crypto = require('crypto');

//------------------------------------------------------------------------------------------------------------------
// Genera un token aleatorio para restablecimiento de contraseña
function generateResetToken() {
    return crypto.randomBytes(32).toString('hex');
}

module.exports = {
    generateResetToken
};