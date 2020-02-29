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

var utils = require('./lib/utils.js')

//------

var force_reply = {
    reply_markup: JSON.stringify({ force_reply: true }
    )
};

bot.onText(/\/join/, (msg) => {
    utils.userExists(msg.from.id).then(exists => {
        if (exists)
            bot.sendMessage(msg.chat.id, "You're already playing. Try listing with /list_Judaspers");
        else {
            bot.sendMessage(msg.chat.id, "This is a private bot. Please enter a password to access.", force_reply)
                .then(payload => {
                    bot.onReplyToMessage(payload.chat.id, payload.message_id, msg => {
                        const passResponse = msg.text; 
                        if (passResponse == "***REMOVED***") { 
                            const currentDate = new Date();
                            utils.addUser(msg.from.id, msg.from.first_name, currentDate);
                            bot.sendMessage(msg.chat.id, "Welcome to the game " + msg.from.first_name + "!");
                        }
                        else {
                            bot.sendMessage(msg.chat.id, "Sorry. Wrong password.");
                        }
                    })
                }
            )
            
        }
    });
});

// TODO: add the new date to stats
bot.onText(/\/change_date_to/, (msg) => {
    bot.sendMessage(msg.chat.id, "Please **mention reply** with your last Judas date (yyyy/mm/dd)", force_reply).then(payload => {
        bot.onReplyToMessage(payload.chat.id, payload.message_id, msg => {
            let dateText = msg.text;
            let dateIsValid = utils.checkValidDate(dateText)
            if (!dateIsValid) {
                bot.sendMessage(msg.chat.id, "Date is invalid. Correct format is yyyy/mm/dd");
                return;
            }
            const newDate = new Date(dateText);
            utils.userExists(msg.from.id).then(exists => {
                if (exists) {
                    utils.setLastJudasDate(msg.from.id, newDate.getTime());
                    bot.sendMessage(msg.chat.id, "Date of " + msg.from.first_name + " has been updated.");
                } else {
                    bot.sendMessage(msg.chat.id, msg.from.first_name + ", you're not playing. If you want to join, send /join.");
                }
            })
        })
    })
});

bot.onText(/\/list_Judaspers/, (msg) => {
    utils.userExists(msg.from.id).then(exists => {
        if (!exists) {
            bot.sendMessage(msg.chat.id, msg.from.first_name + ", you're not playing. If you want to join, send /join.");
            return;
        }
        let message = "------------------------\n"
            + "List of Judaspers"
            + "\n------------------------\n";
        // Fetching ordered data
        utils.getJudaspersList().then(result => {
            message += result;
            bot.sendMessage(msg.chat.id, message);
        })
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

bot.onText(/\/set_birthdate/, (msg) => {
    bot.sendMessage(msg.chat.id, "Please **mention reply** with your birthdate (yyyy/mm/dd)", force_reply).then(payload => {
        const replyListenerId = bot.onReplyToMessage(payload.chat.id, payload.message_id, msg => {
            let dateText = msg.text;
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
        })
    })
});

bot.onText(/\/list_days_lived/, (msg) => {
    utils.userExists(msg.from.id).then(exists => {
        if (!exists) {
            bot.sendMessage(msg.chat.id, msg.from.first_name + ", you're not playing. If you want to join, send /join.");
            return;
        }
        let message = "------------------------\n"
            + "Days lived"
            + "\n------------------------\n";
        utils.getDaysLived().then(result => {
            message += result;
            bot.sendMessage(msg.chat.id, message);
        })
    })
})

bot.onText(/\/list_birthdates/, (msg) => {
    utils.userExists(msg.from.id).then(exists => {
        if (!exists) {
            bot.sendMessage(msg.chat.id, msg.from.first_name + ", you're not playing. If you want to join, send /join.");
            return;
        }
        let message = "------------------------\n"
            + "Birthdays"
            + "\n------------------------\n";
        utils.getBirthDates().then(result => {
            message += result;
            bot.sendMessage(msg.chat.id, message);
        })
    })
})

bot.onText(/\/my_stats/, (msg) => {
    utils.userExists(msg.from.id).then(exists => {
        if (!exists) {
            bot.sendMessage(msg.chat.id, msg.from.first_name + ", you're not playing. If you want to join, send /join.");
            return;
        }
        let message = "------------------------\n"
            + "Stats of " + msg.from.first_name
            + "\n------------------------\n";
        utils.getPersonalStats(msg.from.id).then(result => {
            message += result;
            bot.sendMessage(msg.chat.id, message);
        });
    })
})

bot.onText(/\/global_stats/, (msg) => {
    utils.userExists(msg.from.id).then(exists => {
        if (!exists) {
            bot.sendMessage(msg.chat.id, msg.from.first_name + ", you're not playing. If you want to join, send /join.");
            return;
        }
        let message = "------------------------\n"
            + "Global stats"
            + "\n------------------------\n";
        utils.getGlobalStats().then(result => {
            message += result;
            bot.sendMessage(msg.chat.id, message);
        })
    })
})

bot.onText(/\/awake/, (msg) => {
    utils.userExists(msg.from.id).then(exists => {
        if (!exists) {
            bot.sendMessage(msg.chat.id, msg.from.first_name + ", you're not playing. If you want to join, send /join.");
            return;
        }
        var now = new Date();
        const hour = now.getHours() + 1;
        const minutes = 30;
        console.log(hour);
        if (hour > 5 && hour < 10 && minutes < 31) {
            bot.sendMessage(msg.chat.id, "Good morning " + msg.from.first_name);
            utils.logAwake(msg.from.id, now);
        } else {
            bot.sendMessage(msg.chat.id, "You're out of the awake time range.");
        }
    })
})

bot.onText(/\/malloc()/, (msg) => {
    utils.userExists(msg.from.id).then(exists => {
        if (!exists) {
            bot.sendMessage(msg.chat.id, msg.from.first_name + ", you're not playing. If you want to join, send /join.");
            return;
        }
        utils.checkPointerFree(msg.from.id).then(pointerIsFree => {
            if (pointerIsFree) {
                bot.sendMessage(msg.chat.id, "Computation type", {
                    reply_markup: {
                        inline_keyboard: [[
                            {
                                text: 'Concurrent',
                                callback_data: 'concurrency'
                            }, {
                                text: 'Parallel',
                                callback_data: 'parallelism'
                            }
                        ]]
                    }
                })
            }
            else if (!pointerIsFree) {
                bot.sendMessage(msg.chat.id, "Eeeeeepa, you already got someone.");
            }
        })
    })
})


bot.on('callback_query', (callback) => {
    const msg = callback.message;
    if (callback.data == 'concurrency') {
        let text = {
            reply_markup: {
                inline_keyboard: [[
                    {
                        text: 'Lock',
                        callback_data: 'lock'
                    }, {
                        text: 'Mutual exclusion',
                        callback_data: 'mutual-exclusion'
                    }
                ]]
            }
        }
        bot.sendMessage(msg.chat.id, "Concurrency type ", text);
    }
    if (callback.data == 'parallelism') {
        registerPartner(msg, 'parallelism');
    }
    if (callback.data == 'mutual-exclusion') {
        registerPartner(msg, 'mutual-exclusion');
    }
    if (callback.data == 'lock') {
        registerPartner(msg, 'lock');
    }

})

function registerPartner(msg, type) {
    bot.sendMessage(msg.chat.id, "Please **mention reply** with the name of the partner", force_reply).then(payload => {
        const replyListenerId = bot.onReplyToMessage(payload.chat.id, payload.message_id, msg => {
            const name = msg.text;
            bot.removeReplyListener(replyListenerId)
            utils.registerPartner(msg.from.id, type, name);
            bot.sendMessage(msg.chat.id, name + " has been locked");
        })
        console.log(replyListenerId);
    })
}

bot.onText(/\/list_partners/, (msg) => {
    utils.userExists(msg.from.id).then(exists => {
        if (!exists) {
            bot.sendMessage(msg.chat.id, msg.from.first_name + ", you're not playing. If you want to join, send /join.");
            return;
        }
        let message = "------------------------\n"
            + "Listing partners"
            + "\n------------------------\n";
        utils.listPartners().then(result => {
            message += result;
            bot.sendMessage(msg.chat.id, message);
        })
    })
})

bot.onText(/\/free/, (msg) => {
    utils.userExists(msg.from.id).then(exists => {
        if (!exists) {
            bot.sendMessage(msg.chat.id, msg.from.first_name + ", you're not playing. If you want to join, send /join.");
            return;
        }
        utils.freePartner(msg.from.id).then(freed => {
            if (freed)
                bot.sendMessage(msg.chat.id, msg.from.first_name + " has been freed. Run. RUN!");
            else
                bot.sendMessage(msg.chat.id, "Whatchu running from, bitch? You ain't got no partner.");
        })
    })

})

bot.on('polling_error', (error) => {
    console.log(error);  // => 'EFATAL'
});