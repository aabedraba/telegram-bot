const TelegramBot = require('node-telegram-bot-api');
const TOKEN = process.env.TELEGRAM_TOKEN || '***REMOVED***';
//Heroku config
const options = {
    webHook: {
        port: process.env.PORT,
    }
};
const url = process.env.APP_URL || 'https://wingmennoJudaspers.herokuapp.com:443';
const bot = new TelegramBot(TOKEN, options);
bot.setWebHook(`${url}/bot${TOKEN}`);

//Adding firebase support
var firebase = require('firebase/app');
require('firebase/database');

var firebaseConfig = {
    apiKey: "***REMOVED***",
    authDomain: "***REMOVED***",
    databaseURL: "***REMOVED***",
    projectId: "***REMOVED***",
    storageBucket: "***REMOVED***.appspot.com",
    messagingSenderId: "***REMOVED***",
    appId: "1:***REMOVED***:web:467d2008f618539644ffb9"
};

firebase.initializeApp(firebaseConfig);
var database = firebase.database();

//------

function addUser(id, name, date) {
    database.ref('/users/' + id).set({
        name: name,
        date: date.getTime()
    });
}

async function userExists(id) {
    return await database.ref('/users/' + id).once('value').then(snapshot => {
        if (snapshot.exists())
            return true;
        else
            return false;
    })
}

//No arguments handling
bot.onText(/\/change_date_to/, (msg) => {
    bot.sendMessage(msg.chat.id, "Enter a valid date. Example /change_date_to 2019/02/30");
});

bot.onText(/\/change_date_to (.+)/, (msg, match) => {
    let dateText = match[1];
    let newDate = new Date(dateText);

    if (dateText.length != 10 || dateText.length == 0 ) {
        bot.sendMessage(msg.chat.id, "Enter a valid date. Example /change_date_to 2019/02/30");
        return;
    }

    userExists(msg.from.id).then(exists => {
        if (exists) {
            addUser(msg.from.id, msg.from.first_name, newDate);
            bot.sendMessage(msg.chat.id, "Date of " + msg.from.first_name + " has been updated.");
        } else {
            bot.sendMessage(msg.chat.id, msg.from.first_name + ", you're not playing. If you want to join, send /join.");
        }
    });
});

bot.onText(/\/list_Judaspers/, (msg) => {
    const currentDate = new Date();
    let counter = 0;
    let message = "------------------------\n"
        + "List of Judaspers"
        + "\n------------------------\n";
    // Fetching ordered data
    database.ref('/users/').orderByChild('date').once('value').then(function (snapshot) {
        snapshot.forEach(function (child) {
            let userDate = child.val().date;
            let daysSinceLastJudas = Math.floor((currentDate.getTime() - userDate) / (1000 * 3600 * 24));
            message += (counter += 1) + " - " + child.val().name + ' ' + daysSinceLastJudas + ' days\n';
        })
        bot.sendMessage(msg.chat.id, message);
    });
});

bot.onText(/\/restart_me/, (msg) => {
    userExists(msg.from.id).then(exists => {
        if (exists) {
            const currentDate = new Date();
            addUser(msg.from.id, msg.from.first_name, currentDate); //re-write in database
            bot.sendMessage(msg.chat.id, "This time you can do it! Date reset.");
        } else {
            bot.sendMessage(msg.chat.id, msg.from.first_name + ", you're not playing. If you want to join, send /join.");
        }
    });
});

bot.onText(/\/join/, (msg) => {
    userExists(msg.from.id).then(exists => {
        if (exists)
            bot.sendMessage(msg.chat.id, "You're already playing. Try listing with /list_Judaspers");
        else {
            const currentDate = new Date();
            addUser(msg.from.id, msg.from.first_name, currentDate);
            bot.sendMessage(msg.chat.id, "Welcome to the game " + msg.from.first_name + "!");
        }
    });
});

bot.on('polling_error', (error) => {
    console.log(error);  // => 'EFATAL'
});