const TelegramBot = require('node-telegram-bot-api');
const TOKEN = process.env.TELEGRAM_TOKEN || '***REMOVED***';
//Heroku config
const options = {
    webHook: {
        port: process.env.PORT,
    }
    // to run local node, commet webhook and uncomment polling
    // polling: true
};
const url = process.env.APP_URL || '***REMOVED***';
const bot = new TelegramBot(TOKEN, options);
bot.setWebHook(`${url}/bot${TOKEN}`); // comment when running local node

var utils = require('./utils.js')

//------
bot.onText(/\/join/, (msg) => {
    utils.userExists(msg.from.id).then(exists => {
        if (exists)
            bot.sendMessage(msg.chat.id, "You're already playing. Try listing with /list_Judaspers");
        else {
            const currentDate = new Date();
            utils.addUser(msg.from.id, msg.from.first_name, currentDate);
            bot.sendMessage(msg.chat.id, "Welcome to the game " + msg.from.first_name + "!");
        }
    });
});

bot.onText(/\/change_date_to (.+)/, (msg, match) => {
    let dateText = match[1];
    const dateIsValid = utils.checkValidDate(dateText);

    if (!dateIsValid) {
        bot.sendMessage(msg.chat.id, "Date is invalid. Correct format: yyyy/mm/dd");
        return;
    }

    const newDate = new Date(dateText);
    utils.userExists(msg.from.id).then(exists => {
        if (exists) {
            utils.setLastJudasDate(msg.from.id, newDate.getTime());
            utils.addRestartToStats(msg.from.id, newDate.getTime());
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
    utils.getJudaspersList().then(result => {
        message += result;
        bot.sendMessage(msg.chat.id, message);
    })
});

bot.onText(/\/restart_me/, (msg) => {
    utils.userExists(msg.from.id).then(exists => {
        if (exists) {
            const currentDate = new Date();
            utils.setLastJudasDate(msg.from.id, currentDate.getTime());
            utils.addRestartToStats(msg.from.id, currentDate.getTime());
            bot.sendMessage(msg.chat.id, "This time you can do it! Date reset.");
        } else {
            bot.sendMessage(msg.chat.id, msg.from.first_name + ", you're not playing. If you want to join, send /join.");
        }
    });
});

bot.onText(/\/set_birthdate (.+)/, (msg, match) => {
    let dateText = match[1];
    let dateIsValid = utils.checkValidDate(dateText)
    if (!dateIsValid) {
        bot.sendMessage(msg.chat.id, "Date is invalid. Correct format is yyyy/mm/dd");
        return;
    }
    const birthDate = new Date(dateText);
    utils.setBirthDate(msg.from.id, birthDate.getTime()).then(dateIsSet => {
        if (!dateIsSet) {
            bot.sendMessage(msg.chat.id, "You're not playing. If you'd like to start, please /join");
            return;
        }
        const daysToBirthday = utils.daysToBirthday(birthDate);
        let message = "Date of " + msg.from.first_name + " updated\n"
            + "Days to your birthday " + daysToBirthday + " days\n"
            + "Check how many days you've lived with /list_days_lived";
        bot.sendMessage(msg.chat.id, message);
    })
});

bot.onText(/\/list_days_lived/, (msg) => {
    let message = "------------------------\n"
        + "Days lived"
        + "\n------------------------\n";
    utils.getDaysLived().then(result => {
        message += result;
        bot.sendMessage(msg.chat.id, message);
    })
})

bot.onText(/\/list_birthdates/, (msg) => {
    let message = "------------------------\n"
        + "Birthdays"
        + "\n------------------------\n";
    utils.getBirthDates().then(result => {
        message += result;
        bot.sendMessage(msg.chat.id, message);
    })
})

bot.onText(/\/my_stats/, (msg) => {
    let message = "------------------------\n"
        + "Stats of " + msg.from.first_name
        + "\n------------------------\n";
    utils.getPersonalStats(msg.from.id).then(result => {
        message += result;
        bot.sendMessage(msg.chat.id, message);
    });
})

bot.onText(/\/global_stats/, (msg) => {
    let message = "------------------------\n"
        + "Global stats"
        + "\n------------------------\n";
    utils.getGlobalStats().then(result => {
        message += result;
        bot.sendMessage(msg.chat.id, message);
    })
})

bot.on('polling_error', (error) => {
    console.log(error);  // => 'EFATAL'
});