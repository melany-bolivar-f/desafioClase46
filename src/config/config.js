require('dotenv').config();

//------------------------------------------------------------------------------------------------------------------
const config = {
    PORT: process.env.PORT || 8080,
    MONGO_URL: process.env.MONGO_URL,
    SESSION_SECRET: process.env.SESSION_SECRET
};

module.exports = config;