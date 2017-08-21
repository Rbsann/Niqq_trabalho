// NPM module imports
const express = require('express');
const app = express();
var pageAPI = require('./api_modules/pageAPI.js');

// Local module imports
const mongo = require('./mongo.js');


// Connect to MongoDB
mongo.connect();
var port = 8222;

// Detect correct client IP address when behind reverse proxy
app.set("trust proxy");
app.use("/", pageAPI);
app.listen(port);
console.log("Form Classifier Server running on port "+ port);