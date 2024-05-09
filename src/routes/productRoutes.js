// productRoutes.js
const express = require("express");
const router = express.Router();
const Product = require("../dao/models/products");
const User = require('../dao/models/users');
const { customizeError } = require("../middleware/errorHandler");
const mailService = require('../utils/mailService'); 
const { logger } = require('../utils/logger');


//------------------------------------------------------------------------------------------------------------------
// Define las rutas relacionadas con los productos
router.get("/", async (req, res) => {
    try {
        const user = req.user;

        const { page = 1, limit = 20 } = req.query;
        const pageValue = parseInt(page);
        const limitValue = parseInt(limit);
        const totalProducts = await Product.countDocuments({ stock: { $gt: 0 } }); 
        const totalPages = Math.ceil(totalProducts / limitValue);
        const products = await Product.find({ stock: { $gt: 0 } }) 
            .limit(limitValue)
            .skip((pageValue - 1) * limitValue)
        const hasPrevPage = pageValue > 1;
        const hasNextPage = pageValue < totalPages;
        const prevLink = hasPrevPage ? `/products?page=${pageValue - 1}&limit=${limitValue}` : null;
        const nextLink = hasNextPage ? `/products?page=${pageValue + 1}&limit=${limitValue}` : null;
        const result = {
            status: "success",
            payload: products,
            totalPage: totalPages,
            prevpage: hasPrevPage ? pageValue - 1 : null,
            nextPage: hasNextPage ? pageValue + 1 : null,
            page: pageValue,
            hasprevpage: hasPrevPage,
            hasnextpage: hasNextPage,
            prevLink: prevLink,
            nextLink: nextLink
        }; 

        if (user) {
            const userFromDB = await User.findById(user._id);
            const isAdmin = userFromDB.role === 'admin';
            const isPremium = userFromDB.role === 'premium';
            const isUser = userFromDB.role === 'user';
            let isAdminFalse = false;
            let isPremiumFalse = false;
            let isUserFalse = false;
            if (!isAdmin){
                isAdminFalse = true;
            }
            if (!isPremium){
                isPremiumFalse = true;
            }
            if (!isUser){
                isUserFalse = true;
            }
            res.render('product', { products, user: userFromDB, isAdmin, isAdminFalse, isPremium, isPremiumFalse, isUser, isUserFalse });
        } else {
            res.render('product', { products });
        }
    } catch (error) {
        res.status(500).json({ status: "error", message: customizeError('INTERNAL_SERVER_ERROR') });
    }
});

router.get('/:pid', async (req, res) => {
    try {
        const productId = req.params.pid; 
        const product = await Product.findById(productId);
        if (product) {
            res.status(200).json({ status: "ok", data: product });
        } else {
            res.status(404).json({ status: "error", message: customizeError('PRODUCT_NOT_FOUND') });
        }
    } catch (error) {
        res.status(500).json({ status: "error", message: customizeError('ERROR') });
    }
});

router.post('/', async (req, res) => {
    try {
        // Obtenemos el ID del usuario autenticado
        const ownerId = req.user._id;

        const { title, description, code, price, stock, category, thumbnails } = req.body;
        if (!title || !description || !code || !price || !stock || !category) {
            return res.status(400).json({ status: "error", message: customizeError('MISSING_FIELDS') });
        }

        const productData = {
            title,
            description,
            code,
            price,
            stock,
            status: true,
            category,
            thumbnails,
            owner: ownerId, // Almacenamos el ID del usuario como propietario del producto
        };

        const newProduct = await Product.create(productData);
        const io = req.app.get("io");
        io.emit("productAdded", newProduct);
        setTimeout(() => {
            res.redirect('/products');
        }, 1000);
    } catch (error) {
        res.status(500).json({ status: "error", message: customizeError('INTERNAL_SERVER_ERROR') });
    }
});

router.put('/:pid', async (req, res) => {
    try {
        const productId = req.params.pid;
        const updatedProductData = req.body;
        if (Object.keys(updatedProductData).length === 0) {
            return res.status(400).json({ status: "error", message: customizeError('EMPTY_UPDATE_FIELDS') });
        }
        const updatedProduct = await Product.findByIdAndUpdate(productId, updatedProductData, { new: true });        
        if (!updatedProduct) {
            return res.status(404).json({ status: "error", message: customizeError('PRODUCT_NOT_FOUND') });
        }

        const io = req.app.get("io");
        io.emit("updateProducts", await Product.find());
        
        return res.status(200).json({ status: "ok", message: customizeError('PRODUCT_UPDATED'), data: updatedProduct });
    } catch (error) {
        res.status(500).json({ status: "error", message: customizeError('INTERNAL_SERVER_ERROR') });
    }
}); 

router.delete('/:pid', async (req, res) => {
    try {
        const productId = req.params.pid;
        
        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({ status: "error", message: customizeError('PRODUCT_NOT_FOUND') });
        }

        const ownerId = product.owner; 

        const user = await User.findById(ownerId);

        if (!user) {
            return res.status(404).json({ status: "error", message: customizeError('USER_NOT_FOUND') });
        }

        const io = req.app.get("io");
        io.emit("productDeleted", productId); 

        const ownerEmail = user.email; 

        await Product.findByIdAndDelete(productId);

        const subject = "Notificación de eliminación de producto"



        const message = `
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Notificación de eliminación de producto</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    margin: 0;
                    padding: 0;
                    background-color: #f4f4f4;
                }
                .container {
                    max-width: 600px;
                    margin: 20px auto;
                    padding: 20px;
                    background-color: #fff;
                    border-radius: 10px;
                    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
                }
                h1 {
                    color: #333;
                }
                p {
                    color: #555;
                }
                .button {
                    display: inline-block;
                    padding: 10px 20px;
                    background-color: rgb(103, 228, 147);
                    color: black;
                    border: none;
                    border-radius: 5px;
                    text-decoration: none;
                    font-size: 16px;
                    cursor: pointer;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Notificación de eliminación de producto</h1>
                <p>Hola,</p>
                <p>Tu producto <strong>"${product.title}"</strong> ha sido eliminado.</p>
                <p>Si necesitas más información, no dudes en ponerte en contacto con nosotros.</p>
                <p>Saludos,</p>
                <p>Tu equipo</p>
            </div>
        </body>
        </html>
    `;

        await mailService.sendNotificationEmail(ownerEmail, message, subject);
        
        res.status(200).json({ status: "success", message: "Producto eliminado correctamente" });
    } catch (error) {
        console.error('Error al eliminar el producto:', error);
        res.status(500).json({ status: "error", message: customizeError('INTERNAL_SERVER_ERROR') });
    }
});


// Exporta el enrutador para ser utilizado en otras partes de la aplicación
module.exports = router;
