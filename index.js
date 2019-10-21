const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const token = 'deleted:deleted';
const bot = new TelegramBot(token, { polling: true });

let rawdata = fs.readFileSync('players.json');
let players = JSON.parse(rawdata);

function writeToJSON(){
    const jsonificado = JSON.stringify(players);
    fs.writeFile("players.json", jsonificado);
}

function sort(updatedUser) {
    const updatedPlayerDate = new Date(updatedUser.date);
    let updated = false;
    for (let index = 0; index < players.length; index++) {
        const checkedPlayerDate = new Date(players[index].date);
        let dayDifference = updatedPlayerDate - checkedPlayerDate;
        if ( dayDifference <= 0 ){
            players.splice(index, 0, updatedUser);
            updated = true;
            break;
        }
    }
    if (!updated)
        players.push(updatedUser);
        
    writeToJSON();
}

bot.onText(/\/change_date_to/, (msg) => {
    let newDate = msg.text.slice(16);
    if (players.length == 0) {
        bot.sendMessage(msg.chat.id, "There are no players.");
    } else if (newDate.length != 10) {
        bot.sendMessage(msg.chat.id, "Enter a valid date. Example /change_date_to 2019/02/30");
    } else {
        let found = false;
        for (let index = 0; index < players.length; index++) {
            if (players[index].id === msg.from.id) {
                found = true;
                players[index].date = new Date(newDate);
                bot.sendMessage(msg.chat.id, msg.from.first_name + " changed date");
                const updatedUser = players.splice(index, 1);
                sort(updatedUser[0]);
                break;
            }
        }
        if (!found)
            bot.sendMessage(msg.from.id, msg.from.first_name + ", you're not playing. If you want to join, send /join.");
    }
})

bot.onText(/\/list_Judaspers/, (msg) => {
    let message = "---------------\n";
    message += "List of Judaspers\n";
    message += "---------------\n";
    const currentDate = new Date();
    for (let i = 0; i < players.length; i++) {
        const playerDate = new Date(players[i].date);
        var timeDiff = Math.abs(currentDate.getTime() - playerDate.getTime());
        var diffDays = Math.floor(timeDiff / (1000 * 3600 * 24));
        message += players[i].name + " " + diffDays + " days\n";
    }
    bot.sendMessage(msg.chat.id, message);
})

bot.onText(/\/restart_me/, (msg) => {
    const id = msg.from.id;
    let found = false;
    for (let i = 0; i < players.length; i++) {
        if (players[i].id == id) {
            players.splice(i, 1);
            const updatedUser = { id: msg.chat.id, name: msg.from.first_name, date: new Date() };
            players.push(updatedUser);
            writeToJSON(updatedUser);
            bot.sendMessage(msg.chat.id, msg.from.first_name + " has restarted counter.");
            found = true;
            break;
        }
    }
    if (!found) {
        bot.sendMessage(msg.from.id, msg.from.first_name + ", you're not playing. If you want to join, send /join.");
    }
})

bot.onText(/\/join/, (msg) => {
    const newUser = { id: msg.from.id, name: msg.from.first_name, date: new Date() };
    let found = false;
    if (players.length == 0) {
        found = false;
    } else {
        for (let index = 0; index < players.length; index++) {
            if (players[index].id == msg.from.id) {
                found = true;
                break;
            }
        }
    }


    if (!found) {
        players.push(newUser);
        writeToJSON();
        bot.sendMessage(msg.chat.id, "Added " + msg.from.first_name);
    } else {
        bot.sendMessage(msg.chat.id, "You're already playing... List players with /list_Judaspers");
    }
});

bot.on('message', (msg) => {

    var Hi = "hi";
    if (msg.text.toString().toLowerCase().indexOf(Hi) === 0) {
        bot.sendMessage(msg.chat.id, "Hello  " + msg.from.first_name);
        console.log(msg.from.id);
    }

});