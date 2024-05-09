const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');
const Schema = mongoose.Schema;

//------------------------------------------------------------------------------------------------------------------
const documentSchema = new Schema({
    name: String,
    reference: String
});

// Define el esquema del usuario
const userSchema = new Schema({
    first_name: {
        type: String,
        required: true
    },
    last_name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    age: {
        type: Number
    },
    password: {
        type: String,
        required: true
    },
    cart: {
        type: Schema.Types.ObjectId,
        ref: 'Cart'
    },
    role: {
        type: String,
        default: 'user'
    },
    resetPasswordToken: String, 
    resetPasswordExpires: Date,
    documents: [documentSchema], // Nueva propiedad 'documents'
    last_connection: Date // Nueva propiedad 'last_connection'
});

// Middleware para actualizar last_connection cuando se inicia sesión
userSchema.statics.login = async function(email) {
    const user = await this.findOneAndUpdate(
        { email },
        { last_connection: new Date() },
        { new: true }
    );
    return user;
};

// Middleware para actualizar last_connection cuando se cierra sesión
userSchema.statics.logout = async function(email) {
    const user = await this.findOneAndUpdate(
        { email },
        { last_connection: new Date() },
        { new: true }
    );
    return user;
};

// Agrega la paginación
userSchema.plugin(mongoosePaginate);

// Crea el modelo de usuario
const User = mongoose.model('User', userSchema);

// Exporta el modelo de usuario
module.exports = User;