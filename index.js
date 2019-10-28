const TelegramBot = require('node-telegram-bot-api');
const TOKEN = process.env.TELEGRAM_TOKEN || '***REMOVED***';
//Heroku config
const options = {
     webHook: {
        port: process.env.PORT,
    }
    // to run local node, commet webhook and uncomment polling
    //polling: true
};
const url = process.env.APP_URL || '***REMOVED***';
const bot = new TelegramBot(TOKEN, options);
bot.setWebHook(`${url}/bot${TOKEN}`); // comment when running local node

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

//memory of last message received
let state = {
    lastCommand: '',
    lastInteractedUser: 0
}

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

    if (dateText.length != 10 || dateText.length == 0) {
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
    database.ref('/users/').orderByChild('date').once('value').then(snapshot => {
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

bot.onText(/\/set_birthdate/, (msg) => {
    userExists(msg.from.id).then(exists => {
        if (exists) {
            bot.sendMessage(msg.chat.id, "Please *directly reply to this message' with your birthdate (yyyy/mm/dd)").then(response => {
                bot.onReplyToMessage(response.chat.id, response.message_id, msg => {
                    if ( msg.length == 10 ){
                        const newBirthDate = new Date(msg.text);
                        database.ref('/users/' + msg.from.id).update({birthdate: newBirthDate.getTime()})
                        bot.sendMessage(msg.chat.id, "Date of " + msg.from.id + " updated. Check how many days you've lived with /list_days_lived");
                    }
                    else
                        bot.sendMessage(msg.chat.id, "Format is incorrect. Please start again /set_birthdate")
                })
            })
        }
        else {
            bot.sendMessage(msg.chat.id, "You're not playing. If you'd like to start, please /join");
        }
    })
});

bot.onText(/\/list_days_lived/, (msg) => {
    let message = "------------------------\n"
        + "Days lived"
        + "\n------------------------\n";
    const currentDate = new Date();
    database.ref('/users/').once('value').then(snapshot => {
        snapshot.forEach(user => {
            const userBirthDate = new Date(user.val().birthdate);
            if ( !isNaN(userBirthDate.getTime()) )
                message += user.val().name + " " + Math.floor((currentDate.getTime() - userBirthDate) / (1000 * 3600 * 24)) + " days\n";
        })
        bot.sendMessage(msg.chat.id, message);
    })
})

bot.onText(/\/list_birthdates/, (msg) => {
    let message = "------------------------\n"
    + "Birthdays"
    + "\n------------------------\n";
    database.ref('/users/').once('value').then(snapshot => {
        snapshot.forEach(user => {
            const userBirthDate = new Date(user.val().birthdate);
            if ( !isNaN(userBirthDate) )
                message += user.val().name + " " + userBirthDate.toLocaleDateString("es-ES") + "\n"; 
        })
        bot.sendMessage(msg.chat.id, message );
    })
})