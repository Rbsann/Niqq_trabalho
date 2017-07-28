// NPM module imports
const express = require('express');
const app = express();

// Local module imports
const mongo = require('./mongo.js');
const routes = require('./routes.js');
const general = require('./general.js');

// Connect to MongoDB
mongo.connect();

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

// Start server
app.listen(port);
console.log("Niqq API v" + general.getPackageVersion() + " (" + environment + ") running on localhost:" + port + serverPath);

// Run development server for website
if (!general.isProductionEnvironment()) {
    const devServer = express();
    devServer.use(express.static("../Site"));
    devServer.listen(8085);
    console.log("Website dev server running on port 8085");
}