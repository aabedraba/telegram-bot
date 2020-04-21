//Adding firebase support
var firebase = require('firebase/app');
var config = require('../config');
require('firebase/database');

var firebaseConfig = {
    apiKey: config.firebaseApi,
    authDomain: config.authDomain,
    databaseURL: config.dbUrl,
    projectId: config.projectId,
    storageBucket: config.storage,
    messagingSenderId: config.sender,
    appId: config.appId
};

firebase.initializeApp(firebaseConfig);
var database = firebase.database();
console.log()

function logAttempt(userId, userName) {
    database.ref('/attempts/' + userId).set({
        name: userName
    });
}

async function getJudasmenList() {
    return await database.ref('/users/').orderByChild('date').once('value').then(snapshot => {
        let message = "";
        const currentDate = new Date();
        let counter = 0;
        snapshot.forEach(function (user) {
            let userDate = user.val().date;
            let daysSinceLastJudas = Math.floor((currentDate.getTime() - userDate) / (1000 * 3600 * 24));
            message += (counter += 1) + " - " + user.val().name + ' ' + daysSinceLastJudas + ' days\n';
        })
        return message;
    });
}

async function getUsers() {
    return await database.ref('/users/').once('value').then(snapshot => {
        return snapshot.val();
    })
}

function addUser(id, name, date) {
    database.ref('/users/' + id).set({
        name: name,
        date: date.getTime()
    });
}

function calculateLongestStreak(datesArray) {
    let longestStreak = 0;
    const currentDate = new Date();
    for (let i = 1; i < datesArray.length; i++) {
        const difference = Math.floor((datesArray[i] - datesArray[i - 1]) / (1000 * 3600 * 24));
        if (difference > longestStreak)
            longestStreak = difference;
    }
    return longestStreak;
}

function addRestartToStats(id, newDate) {
    database.ref('/stats/' + id).once('value').then(snapshot => {
        if (snapshot.exists() && !snapshot.val().judasDates != null) {
            let dates = snapshot.val().date;
            dates.push(newDate);
            let newLongestStreak = module.exports.calculateLongestStreak(dates);
            database.ref('/stats/' + id).set({
                longestStreak: newLongestStreak,
                date: dates
            })
        }
        else {
            database.ref('/stats/' + id).update({
                longestStreak: 0,
                judasDates: [newDate]
            });
        }
    })
}

async function userExists(id) {
    return await database.ref('/users/' + id).once('value').then(snapshot => {
        if (snapshot.exists())
            return true;
        else
            return false;
    })
}

async function getPersonalStats(id) {
    return await database.ref('/stats/' + id).once('value').then(snapshot => {
        let message = "Longest no-judas streak: " + snapshot.val().longestStreak + "\n";
        message += "Number of restarts: " + snapshot.val().date.length;
        return message;
    })
}

async function getBirthDates() {
    return await database.ref('/users/').once('value').then(snapshot => {
        let message = "";
        snapshot.forEach(user => {
            const userBirthDate = new Date(user.val().birthdate);
            if (!isNaN(userBirthDate))
                message += user.val().name
                    + " "
                    + userBirthDate.getDate() + "/"
                    + (userBirthDate.getMonth() + 1) + "/"
                    + userBirthDate.getFullYear() + ", "
                    + module.exports.daysToBirthday(userBirthDate) + " days to birthday\n"
        })
        return message;
    })
}

async function getDaysLived() {
    const currentDate = new Date();
    return await database.ref('/users/').once('value').then(snapshot => {
        let message = "";
        snapshot.forEach(user => {
            const userBirthDate = new Date(user.val().birthdate);
            if (!isNaN(userBirthDate.getTime()))
                message += user.val().name + " " + Math.floor((currentDate.getTime() - userBirthDate) / (1000 * 3600 * 24)) + " days\n";
        })
        return message;
    })
}

async function setBirthDate(id, birthDate) {
    return await module.exports.userExists(id).then(exists => {
        if (exists) {
            database.ref('/users/' + id).update({ birthdate: birthDate })
            return true;
        }
        else return false;
    })
}

function checkValidDate(date) {
    if (date.length == 10) {
        newDate = new Date(date);
        if (isNaN(newDate.getTime()))
            return false;
        else return true;
    }
    return true;
}

function setLastJudasDate(id, newDate) {
    database.ref('/users/' + id).update({ date: newDate });
}

async function getGlobalStats() {
    let message = "";
    let users = await module.exports.getUsers();
    return await database.ref('/stats/').once('value').then(snapshot => {
        snapshot.forEach(stats => {
            const now = new Date();
            let daysToLastJudas = Math.floor((now.getTime() - users[stats.key].date) / (1000 * 3600 * 24));
            message += users[stats.key].name + "\n"
                + "  - Last judas: " + daysToLastJudas + " days ago" + "\n"
                + "  - Number of restarts: " + stats.val().date.length + "\n"
                + "  - Longest no-judas streak: " + stats.val().longestStreak + "\n"
        })
        return message;
    })
}

function daysToBirthday(birthDate) {
    const currentDate = new Date();
    let nextBirthday = new Date(currentDate.getFullYear(), birthDate.getMonth(), birthDate.getDate());
    let daysToBirthday = nextBirthday - currentDate;
    if ( daysToBirthday > 0 ){
        return Math.ceil(daysToBirthday/(1000*3600*24))
    } else {
        let nextBirthday = new Date(currentDate.getFullYear() + 1, birthDate.getMonth(), birthDate.getDate());
        let daysToBirthday = nextBirthday - currentDate;
        return Math.ceil(daysToBirthday/(1000*3600*24))
    }
}

function logAwake(userId, time) {
    database.ref('/stats/' + userId).once('value').then(snapshot => {
        if (snapshot.exists() && (snapshot.val().awakeDates != null)) {
            let dates = snapshot.val().awakeDates;
            let longestStreak = snapshot.val().longestAwakeStreak;
            const hoursDifference = Math.abs((time.getTime() - dates[dates.length - 1]) / 36e5);
            if (hoursDifference > 25) longestStreak = 0;
            else longestStreak += 1;
            dates.push(time.getTime());
            database.ref('/stats/' + userId).update({
                longestAwakeStreak: longestStreak,
                awakeDates: dates
            })
        }
        else {
            database.ref('/stats/' + userId).update({
                longestAwakeStreak: 0,
                awakeDates: [time.getTime()]
            });
        }
    });
}

async function checkPointerFree(userId) {
    return await database.ref('/partner/' + userId).once('value').then(snapshot => {
        if ( !snapshot.exists() || snapshot.val().name == null )
            return true;
        else return false; 
    })
}

function registerPartner(userId, type, name) {
    database.ref('/partner/' + userId).update({
        name: name,
        type: type
    });
    database.ref('/stats/' + userId).once('value').then(snapshot => {
        if (snapshot.exists() && snapshot.val().partners != null) {
            let partners = snapshot.val().partners;
            partners.push({"name": name, "type": type});
            database.ref('/stats/' + userId).update({
                partners: partners
            })
        }
        else {
            database.ref('/stats/' + userId).update({
                partners: [{"name": name, "type": type}]
            });
        }
    })
}

async function listPartners() {
    let message = "";
    let users = await module.exports.getUsers();
    return await database.ref('/partner/').once('value').then(snapshot => {
        snapshot.forEach(partner => {
            if (partner.val().name != null )
                message += users[partner.key].name + " is in " + partner.val().type + " relation with " + partner.val().name + "\n";
        })
        return message;
    })
}

async function freePartner(userId) {
    return await database.ref('/partner/' + userId).once('value').then(snapshot => {
        if ( snapshot.exists() && snapshot.val() != null ){
            database.ref('/partner/' + userId).update({
                name: null,
                type: null
            })
            return true;
        }
        return false;
    })
}

module.exports = {
    logAttempt,
    getJudasmenList,
    getUsers,
    calculateLongestStreak,
    addRestartToStats,
    userExists,
    getPersonalStats,
    getBirthDates,
    getDaysLived,
    setBirthDate,
    checkValidDate,
    setLastJudasDate,
    getGlobalStats,
    daysToBirthday,
    logAwake,
    checkPointerFree,
    registerPartner,
    listPartners,
    freePartner
}