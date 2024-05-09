const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

//------------------------------------------------------------------------------------------------------------------
// Define el esquema del producto con varios campos y restricciones
const productSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        required: true,
        min: 0,
    },
    description: String,
    code: {
        type: String,
        required: true,
        unique: true,
    },
    stock: {
        type: Number,
        required: true,
        min: 0,
    },
    status: {
        type: Boolean,
        default: true,
    },
    category: {
        type: String,
        required: true,
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId, // Tipo ObjectId para almacenar el _id del usuario
        ref: 'User', // Referencia al modelo de usuario
        required: true,
    },
}, { collection: 'Products' });

// Crea el modelo 'Product' basado en el esquema definido
productSchema.plugin(mongoosePaginate);
const Product = mongoose.model('Product', productSchema);

// Exporta el modelo 'Product' para ser utilizado en otras partes de la aplicación
module.exports = Product;