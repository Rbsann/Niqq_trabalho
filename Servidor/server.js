// NPM module imports
const express = require('express');
const app = express();

// Local module imports
const mongo = require('./mongo.js');
const routes = require('./routes.js');
const general = require('./general.js');

// Get execution parameters
var environment = general.getEnvironment();
var port = general.getPort();
var serverPath = general.getServerPath();

// Set ejs as view engine
app.set('view engine', 'ejs');

// Detect correct client IP address when behind reverse proxy
app.set("trust proxy");

// Set up express routes
app.use(serverPath, routes); 


// Connect to MongoDB and then start server
mongo.connect()
    .then(_ => {
        console.log("Connected to MongoDB!");
        console.log("Starting server...");
        app.listen(port, _ => {
            console.log("Niqq API v" + general.getPackageVersion() + " (" + environment + ") running on localhost:" + port + serverPath);
            app.emit("serverReady");
        });
    })
    .catch(error => console.log(error));

// Run development server for website
if (general.isDevelopmentEnvironment()) {
    const devServer = express();
    devServer.use(express.static("../../frontend/Site"));
    devServer.listen(8085);
    console.log("Website dev server running on port 8085");
}

module.exports = app;