require('dotenv').config();

const config = {
    telegramToken: process.env.TELEGRAM_TOKEN,
    appUrl: process.env.APP_URL,
    pass: process.env.PASS,
    firebaseApi: process.env.FIREBASE_API,
    authDomain: process.env.AUTH_DOMAIN,
    dbUrl: process.env.DB_URL,
    projectId: process.env.PROJECT_ID,
    storage: process.env.STORAGE,
    sender: process.env.SENDER,
    appId: process.env.APP_ID
}

module.exports = config;