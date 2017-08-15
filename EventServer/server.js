// NPM module imports
const express = require('express');
const basicAuth = require('express-basic-auth');
const moment = require("moment");
const relational_db = require('./relational_db.js');

const app = express();

// Local module imports
const general = require('./general.js');

// const statsAPI = require('./api_modules/statsAPI.js');
// const eventAPI = require('./api_modules/eventAPI.js');

// Connect to SQL database
relational_db.connect()
    .then(_ => {
        // Set up express routes
        const routes = require('./routes.js');
        app.use(serverPath, routes);
        // app.use('/events', eventAPI);
        // app.use('/stats', statsAPI);
        app.listen(port);
        // console.log("Niqq API v" + general.getPackageVersion() + " (" + environment + ") running on localhost:" + port + serverPath);
    })
    .catch(error => console.log(error));

// Get execution parameters
var environment = general.getEnvironment();
var port = general.getPort();
var serverPath = general.getServerPath();
// var port = 8123;

// Set ejs as view engine
// app.set("view engine", "ejs");

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
app.all('/*', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    next();
  });

app.get("/", (req, res) => {
    res.render('stats');
});

// Start server
// app.listen(port);
console.log("Niqq Stats v" + general.getPackageVersion() + " (" + environment + ") running on localhost:" + port);