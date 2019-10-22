const TelegramBot = require('node-telegram-bot-api');
const TOKEN = process.env.TELEGRAM_TOKEN || '***REMOVED***';
const options = {
    webHook: {
        port: process.env.PORT
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

bot.onText(/\/change_date_to (.+)/, (msg, match) => {
    let dateText = match[1];
    if (dateText.length != 10) {
        bot.sendMessage(msg.chat.id, "Enter a valid date. Example /change_date_to 2019/02/30");
    } else {
        let newDate = new Date(dateText);
        database.ref('/users/' + msg.from.id).once('value').then(function (snapshot) {
            if (snapshot.exists()) {
                firebase.database().ref('/users/' + msg.from.id).set({
                    name: msg.from.first_name,
                    date: newDate.getTime()
                });
                bot.sendMessage(msg.from.id, "Date of " + msg.from.first_name + " has been updated.");
            } else
                bot.sendMessage(msg.from.id, msg.from.first_name + ", you're not playing. If you want to join, send /join.");
        })
    }
});

bot.onText(/\/list_Judaspers/, (msg) => {
    let message = "------------------------\n";
    message += "List of Judaspers\n";
    message += "------------------------\n";
    const currentDate = new Date();
    // Fetching ordered data
    firebase.database().ref('/users/').orderByChild('date').once('value').then(function (snapshot) {
        snapshot.forEach(function (child) {
            let userDate = child.val().date;
            let daysSinceLastJudas = Math.floor((currentDate.getTime() - userDate) / (1000 * 3600 * 24));
            message += child.val().name + ' ' + daysSinceLastJudas + ' days\n';
        })
        bot.sendMessage(msg.chat.id, message);
    });
});

bot.onText(/\/restart_me/, (msg) => {
    database.ref('/users/' + msg.from.id).once('value').then(function (snapshot) {
        if (snapshot.exists()) {
            let newDate = new Date();
            firebase.database().ref('/users/' + msg.from.id).set({
                name: msg.from.first_name,
                date: newDate.getTime()
            });
            bot.sendMessage(msg.from.id, "This time you can do it! Date reset.");
        }
        else
            bot.sendMessage(msg.from.id, msg.from.first_name + ", you're not playing. If you want to join, send /join.");
    })
});

bot.onText(/\/join/, (msg) => {
    database.ref('/users/' + msg.from.id)
        .once('value')
        .then(function (snapshot) {
            if (snapshot.exists())
                bot.sendMessage(msg.chat.id, msg.chat.first_name + " is already playing.");
            else {
                let currentDate = new Date();
                firebase.database().ref('/users/' + msg.from.id).set({
                    name: msg.from.first_name,
                    date: currentDate.getTime()
                });
                bot.sendMessage(msg.chat.id, "Welcome to the game " + msg.from.first_name + "!");
            }
        });
});

bot.on('polling_error', (error) => {
    console.log(error);  // => 'EFATAL'
});