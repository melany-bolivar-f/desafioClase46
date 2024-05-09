const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

//------------------------------------------------------------------------------------------------------------------
const cartSchema = new mongoose.Schema({
    products: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            mutable: true 
        }
    }],
    UserId: {type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true }
});

cartSchema.plugin(mongoosePaginate);
const Cart = mongoose.model('Cart', cartSchema);


module.exports = Cart;