const express = require("express");
const handlebars = require('express-handlebars')
const app = express();
const { Server } = require('socket.io')
const fs = require("fs");
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const productosRoutes = require('./routes/productRoutes');
const sessionRoutes = require('./routes/sessionRoutes');
const viewRoutes = require('./routes/viewRoutes');
const premiumRouter = require('./routes/premiumRoutes')
const nodemailer = require('nodemailer');
const mockingProductsRoute = require('./routes/mockingProductsRoutes')
const Product = require("./dao/models/products");
const helpers = require('./public/helpers');
const MongoStore = require("connect-mongo")
const session = require('express-session');
const passport = require('passport');
const User = require('./dao/models/users');
const sessionController = require('./controllers/sessionController');
require('dotenv').config()
const config = require('./config/config');
const swaggerMiddleware = require('./middleware/swagger');
const { addLogger, logger } = require('./utils/logger.js');
const swaggerUiExpress = require('swagger-ui-express')
const swaggerJsDoc = require('swagger-jsdoc')
const path = require('path');

const PORT = config.PORT;
const MONGO_URL = config.MONGO_URL;
const SESSION_SECRET = config.SESSION_SECRET;


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
    apis: ['./docs/**/*.yaml'], 
};

const specs = swaggerJsDoc(options);
// Usa el middleware de Swagger
app.use('/apidocs', swaggerUiExpress.serve, swaggerUiExpress.setup(specs))


app.use((req, res, next) => {
    if (req.url === '/') {
        return res.redirect('/products');
    }
    next();
});


app.use(express.json());

app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
    store: MongoStore.create({
        mongoUrl:MONGO_URL, 
        mongoOptions: {
        },
        ttl: 15000000000,
    }),
    secret: SESSION_SECRET,
    resave: false, 
    saveUninitialized: false
}))

app.use(passport.initialize());
app.use(passport.session());


sessionController;


const hbs = handlebars.create({
    extname: '.hbs',
    helpers: helpers,
    runtimeOptions: {
        allowProtoPropertiesByDefault: true,
        allowProtoMethodsByDefault: true,
    },
});

app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// Configurar Handlebars como motor de plantillas
app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');


// Importar las rutas relacionadas con productos y carritos desde archivos externos

const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cartRoutes');

// Configuración de archivos estáticos
app.use('/mockingproducts', mockingProductsRoute);
app.use(express.static('public'));
app.use('/api/carts', cartRoutes);
app.use('/products', productRoutes);
app.use('/carts', cartRoutes);
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/api/sessions', sessionRoutes);
app.use('/', viewRoutes);
app.use('/api/users', premiumRouter);



app.get('/home', async (req, res) => {
    try {
        const products = await Product.find().lean();
        res.render('home', { products });
    } catch (error) {
        logger.error(error);
        res.status(500).render('error', { message: 'Error interno del servidor', error });
    }
});


// Ruta para obtener todos los productos
app.get('/realtimeproducts', (req, res) => {
    res.render('realtimeproducts');
});


// Configurar Socket.io
const httpServer = app.listen(PORT, err =>{
    const localhostLink = `http://localhost:${PORT}/login`;
    if (err)  logger.error(err)
    logger.info(`Escuchando en el puerto ${PORT}. Enlace: ${localhostLink}`);
})


app.use(addLogger)

const io = new Server(httpServer)

app.set('io', io);

io.on("connection", (socket) => {
    logger.info("Nuevo cliente conectado");

    socket.on("productDeleted", async function(productId) {
        try {
            await Product.findByIdAndDelete(productId);
            sendProductsUpdate();
        } catch (error) {
            logger.error(error);
        }
    });

    const sendProductsUpdate = async () => {
        try {
            // Obtener todos los productos desde MongoDB
            const products = await Product.find();
            
            io.emit("updateProducts", products);
        } catch (error) {
            logger.error(error);
        }
    };


    sendProductsUpdate();

    socket.on("updateProducts", () => {
        sendProductsUpdate();
    });

    sendProductsUpdate();
});


mongoose.connect(MONGO_URL);

const db = mongoose.connection;

db.on('error', logger.error.bind(console, 'Error de conexión a MongoDB:'));
db.once('open', () => {
    logger.info('Conexión exitosa a MongoDB');
});

app.use('/api', productosRoutes);
