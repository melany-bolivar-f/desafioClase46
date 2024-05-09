const express = require('express');
const router = express.Router();

//-------------------------------------------------------------------------------------------------------------------

router.get('/', (req, res) => {
    const products = generateMockProducts(100);
    
    res.render('mockingProducts', { products });
});

function generateMockProducts(numProducts) {
    const products = [];
    for (let i = 1; i <= numProducts; i++) {
        products.push({
            id: i,
            name: `Producto ${i}`,
            price: getRandomPrice(),
            description: `Esta es la descripcion del producto ${i}`
        });
    }
    return products;
}


function getRandomPrice() {
    return (Math.random() * (100 - 1) + 1).toFixed(2);
}

module.exports = router;