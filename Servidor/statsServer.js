// NPM module imports
const express = require('express');
const basicAuth = require('express-basic-auth');
const moment = require("moment");
// const relational_db = require('./relational_db.js');

const app = express();

// Local module imports
const mongo = require('./mongo.js');
const general = require('./general.js');
const User = require("./models/user.js");

// const statsAPI = require('./api_modules/statsAPI.js');

// Connect to MongoDB
mongo.connect();

// Connect to SQL database
// relational_db.connect()
//     .then(_ => {
//         // Set up express routes
//         const routes = require('./routes.js');
//         // app.use(serverPath, routes);
//         // app.listen(port);
//         // console.log("Niqq API v" + general.getPackageVersion() + " (" + environment + ") running on localhost:" + port + serverPath);
//     })
//     .catch(error => console.log(error));

// Get execution parameters
var environment = general.getEnvironment();
var port = 8123;

// Set ejs as view engine
app.set("view engine", "ejs");

// Detect correct client IP address when behind reverse proxy
app.set("trust proxy");

// app.use(basicAuth({
//     users: {
//         "niqqadmin": "3993751058209749",
//         "lucasdaniqq": "adorocadastro10"
//     },
//     challenge: true,
//     realm: "NiqqStatsRealm"
// }));

// Configura o uso da API de dados estatísticos dos eventos
// app.use('/events', statsAPI);

app.get("/graphs", (req, res) => {
    res.render('stats2');
});

app.get("/", (req, res) => {
    User.getList()
        .then(users => {
            var durationDay = 24 * 60 * 60 * 1000;
            var durationWeek = durationDay * 7;
            var durationMonth = durationDay * 30;

            var signupCount = users.reduce((count, user) => {
                    var partialCount = count;
                    if (user.signedUp > Date.now() - durationDay) {
                        partialCount.day++;
                    }
                    if (user.signedUp > Date.now() - durationWeek) {
                        partialCount.week++;
                    }
                    if (user.signedUp > Date.now() - durationMonth) {
                        partialCount.month++;
                    }
                    partialCount.total++;
					return partialCount;
            }, {day: 0, week: 0, month: 0, total: 0});

            res.render("stats", {
                signUps: signupCount,
                users: users.map(user => {
                    var userFormatted = user;
                    if (user.signedUp !== undefined)
                        userFormatted.time =  moment(user.signedUp).format("DD/MM/YY HH:mm");
                    return userFormatted;
                })
            });
        })
        .catch(error => console.log(error));
});
// Start server
app.listen(port);
console.log("Niqq Stats v" + general.getPackageVersion() + " (" + environment + ") running on localhost:" + port);