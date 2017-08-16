// Import modules
var bodyParser = require('body-parser');
var general = require('./general.js');

// Import API routes
var eventAPI = require('./api_modules/eventAPI.js');
var statsAPI = require('./api_modules/statsAPI.js');

const routes = require('express').Router();

// JSON request and response middleware
routes.use(bodyParser.json());

// CORS handling middleware
routes.use(function (request, response, next) {
	var origin = request.get("origin");
	var method = request.method.toLowerCase();

	if (method.ignoreCase === "get".ignoreCase) { // allow all get requests
		next();

	} else if (general.isValidOrigin(origin)) { // verify request origin before continuing
		response.header("Access-Control-Allow-Origin", origin);

		if (method === "options") { // if CORS preflight request, respond with allowed methods, headers and max-age
			response.header("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
			response.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
			response.header("Access-Control-Max-Age", "86400"); // preflight response valid for a day
		}

		next();

	} else {
		console.log("Invalid origin attempt: " + origin);
		response.status(403).end(); // invalid origin
	}
});

// Send formatted response middleware
routes.use(function(request, response, next) {
    response.sendResult = function(data) {
		return response.send({
			error: 0,
			newToken: response.locals.newToken, // new token, undefined if not being renewed
			body: data
		});
    };
	response.sendError = function(errorMessage) {
		return response.send({
			error: 1,
			newToken: response.locals.newToken, // new token, undefined if not being renewed
			body: {
				message: errorMessage
			}
		});
	};
	request.getIPAddress = function() {
		return request.headers['x-forwarded-for'] || 
			request.connection.remoteAddress || 
			request.socket.remoteAddress ||
			request.connection.socket.remoteAddress;
	};
	request.getUserAgent = function() {
		return request.headers['user-agent'];
	};
    next();
});

// Tratamento dos Gets
routes.get('/', function (request, response) {
	var serverInstance = "Niqq API v" + general.getPackageVersion() + " (" + general.getEnvironment() + ")";
		response.send(serverInstance + "<br>OK");
});

routes.use('/event', eventAPI);
routes.use('/stats', statsAPI);

// export routes object
module.exports = routes;
