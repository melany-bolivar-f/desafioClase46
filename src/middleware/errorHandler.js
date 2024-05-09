require('dotenv').config(); 

//------------------------------------------------------------------------------------------------------------------
function customizeError(errorCode, additionalInfo = '') {
    const errorMessage = process.env[errorCode];
    if (errorMessage) {
        return `${errorMessage} ${additionalInfo}`;
    } else {
        return 'Se ha producido un error desconocido.';
    }
}

module.exports = { customizeError }; 