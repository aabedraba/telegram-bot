//Adding firebase support
var admin = require("firebase-admin");

var serviceAccount = require("../secrets/***REMOVED***-firebase-adminsdk-7u1k9-8bee33a446.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "***REMOVED***"
});

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
console.log()

module.exports = {

    getJudaspersList: async function () {
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
    },

    getUsers: async function () {
        return await database.ref('/users/').once('value').then(snapshot => {
            return snapshot.val();
        })
    },

    addUser: function (id, name, date) {
        database.ref('/users/' + id).set({
            name: name,
            date: date.getTime()
        });
    },

    calculateLongestStreak: function (datesArray) {
        let longestStreak = 0;
        const currentDate = new Date();
        for (let i = 1; i < datesArray.length; i++) {
            const difference = Math.floor((datesArray[i] - datesArray[i - 1]) / (1000 * 3600 * 24));
            if (difference > longestStreak)
                longestStreak = difference;
        }
        return longestStreak;
    },

    addRestartToStats: function (id, newDate) {
        database.ref('/stats/' + id).once('value').then(snapshot => {
            if (snapshot.exists() && !snapshot.val().JudasDates != null) {
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
                    JudasDates: [newDate]
                });
            }
        })
    },

    userExists: async function (id) {
        return await database.ref('/users/' + id).once('value').then(snapshot => {
            if (snapshot.exists())
                return true;
            else
                return false;
        })
    },

    getPersonalStats: async function (id) {
        return await database.ref('/stats/' + id).once('value').then(snapshot => {
            let message = "Longest no-Judas streak: " + snapshot.val().longestStreak + "\n";
            message += "Number of restarts: " + snapshot.val().date.length;
            return message;
        })
    },

    getBirthDates: async function () {
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
    },

    getDaysLived: async function () {
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
    },

    setBirthDate: async function (id, birthDate) {
        return await module.exports.userExists(id).then(exists => {
            if (exists) {
                database.ref('/users/' + id).update({ birthdate: birthDate })
                return true;
            }
            else return false;
        })
    },

    checkValidDate: function (date) {
        if (date.length == 10) {
            newDate = new Date(date);
            if (isNaN(newDate.getTime()))
                return false;
            else return true;
        }
        return true;
    },

    setLastJudasDate: function (id, newDate) {
        database.ref('/users/' + id).update({ date: newDate });
    },

    getGlobalStats: async function () {
        let message = "";
        let users = await module.exports.getUsers();
        return await database.ref('/stats/').once('value').then(snapshot => {
            snapshot.forEach(stats => {
                const now = new Date();
                let daysToLastJudas = Math.floor((now.getTime() - users[stats.key].date) / (1000 * 3600 * 24));
                message += users[stats.key].name + "\n"
                    + "  - Last Judas: " + daysToLastJudas + " days ago" + "\n"
                    + "  - Number of restarts: " + stats.val().date.length + "\n"
                    + "  - Longest no-Judas streak: " + stats.val().longestStreak + "\n"
            })
            return message;
        })
    },

    daysToBirthday: function (birthDate) {
        const currentDate = new Date();
        const day = birthDate.getDate();
        const month = birthDate.getMonth();
        const year = currentDate.getFullYear() + 1;
        const nextBirthday = new Date(year, month, day);
        return Math.ceil((nextBirthday.getTime() - currentDate.getTime()) / (1000 * 3600 * 24));
    },

    logAwake: function (userId, time) {
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
        })
    }
}