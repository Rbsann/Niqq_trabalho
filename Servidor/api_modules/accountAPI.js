const RateLimit = require('express-rate-limit');

const general = require('../general.js');
const Email = require('./emailAPI.js');
const tokenAuth = require('./tokenAuth.js');

const accountRoutes = require('express').Router();
var User = require('../models/user.js');

var accountAPILimiter = new RateLimit({
	windowMs: 10 * 60 * 1000, // 10 minute window
	max: 40, // requests per windowMs
	delayAfter: 25,
	delayMs: 1000
});

accountRoutes.use(accountAPILimiter);

// Login command
// - Request data: email, password
// - Response data: firstName, token
accountRoutes.post("/login", (request, response) => {
	var payload = request.body;
	var email = payload.email;
	var password = payload.password;
	var user;
	User.getByEmail(email)
		.then(foundUser => {
			user = foundUser;
			return user.validatePassword(password);
		})
		.then(validated => user.newToken(request))
		.then(token => {
			response.sendResult({
				firstName: user.data.name.first,
				pictureURL: user.facebook.pictureURL,
				token: token,
				gender: user.data.gender
			});
		})
		.catch(error => {
			response.sendError("INCORRECT_EMAIL_OR_PASSWORD");
		});
});

// Logout command
// - Authorization required: email, token
// - Request data: none
// - Response data: loggedOut
accountRoutes.post("/logout", tokenAuth, (request, response) => {
	var user = response.locals.user;
	var token = request.body.token;

	user.revokeToken(token)
		.then(result => {
			response.sendResult({ loggedOut: result });
		})
		.catch(error => {
			console.log(error);
			response.sendError("SERVER_ERROR");
		});
});


// Sign up command
// - Request data: email, password, data, encryptedData
// - Response data: firstName, token
accountRoutes.post("/signup", (request, response) => {
	var payload = request.body;

	// read payload
	var email = payload.email;
	var password = payload.password;
	var data = payload.data;
	var encryptedData = payload.encryptedData;

	// create new user instance
	var user = new User();
	user.signedUp = Date.now();

	user.setNewEmail(email)
		.then(confirmationCode => {
			Email.sendConfirmationEmail(data.name.first, email, confirmationCode);
		})
		.then(() => user.updateData(data, encryptedData))
		.then(result => user.saveNewPassword(password))
		.then(result => user.newToken(request))
		.then(token => {
			response.sendResult({
				firstName: user.data.name.first,
				token: token
			});
		})
		.catch((error) => {
			if (error.message.indexOf("duplicate key") !== -1) {
				response.sendError("DUPLICATE_KEY");
				// sendResponseErrorDuplicate(response, error.errmsg.split("$")[1].split("_")[0]);
			} else {
				console.log(error);
				response.sendError("SERVER_ERROR");
			}
		});
});

// Check is email is already signed up
// - Request data: email
// - Response data: emailSignedUp
accountRoutes.post("/checkEmail", (request, response) => {
	var payload = request.body;
	var email = payload.email;

	User.getByEmail(email)
		.then(user => {
			response.sendResult({ emailSignedUp: true });
		})
		.catch(error => {
			response.sendResult({ emailSignedUp: false });
		});
});


// Confirm email
// - Request data: confirmationCode
// - Response data: emailConfirmed
accountRoutes.post('/confirmEmail', function(request, response) {
	var payload = request.body;
	var confirmationCode = payload.confirmationCode;
	
	User.getByEmailConfirmationCode(confirmationCode)
		.then(user => user.confirmEmail())
		.then(result => {
			response.sendResult({ emailConfirmed: true });
		})
		.catch(error => {
			response.sendError("INVALID_CONFIRMATION_CODE");
			if (error.message !== "EMAIL_ALREADY_CONFIRMED" && error.message !== "USER_NOT_FOUND") {
				console.log(error);
			}
		});
});

module.exports = accountRoutes;