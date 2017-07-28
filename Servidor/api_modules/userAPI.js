// Module imports
const Email = require('./emailAPI.js');
const tokenAuth = require('./tokenAuth.js');

const RateLimit = require('express-rate-limit');
const userRoutes = require('express').Router();
var User = require('../models/user.js');


var userAPILimiter = new RateLimit({
	windowMs: 5 * 60 * 1000, // 5 minute window
	max: 200, // requests per windowMs
	delayAfter: 100,
	delayMs: 1000
});

userRoutes.use(userAPILimiter);


// Get all info command
// - Authorization required: email, token
// - Request data: none
// - Response data: data, encryptedData
userRoutes.post("/getAllInfo", tokenAuth, (request, response) => {
	var user = response.locals.user;
	response.sendResult({ data: user.data, encryptedData: user.encryptedData });
});

// Change password command
// - Authorization required: email, token
// - Request data: currentPassword, newPassword, encryptData
// - Response data: changed
userRoutes.post("/changePassword", tokenAuth, (request, response) => {
	var user = response.locals.user;
	var payload = request.body;

	var currentToken = payload.token;

	var currentPassword = payload.currentPassword;
	var newPassword = payload.newPassword;
	var encryptedData = payload.encryptedData;

	user.validatePassword(currentPassword)
		.then(validated => user.saveNewPassword(newPassword, currentToken))
		.then(result => user.updateData(null, encryptedData))
		.then(result => {
			response.sendResult({changed: result});
		})
		.catch(error => {
			response.sendError(error.message);
		});
});

// Request password reset command
// - Request data: resetEmail
// - Response data: requestReceived
userRoutes.post("/requestPasswordReset", (request, response) => {
	var payload = request.body;
	var email = payload.resetEmail;

	var user;
	User.getByEmail(email)
		.then(fetchedUser => {
			user = fetchedUser;
			return user.newPasswordResetCode();
		})
		.then(code => {
			Email.sendPasswordResetEmail(user.data.name.first, user.email, code);
		})
		.catch(error => {
			if (error.message !== "USER_NOT_FOUND")
				console.log(error); // only log unexpected errors
		});

	response.sendResult({requestReceived: true});
});

// Password reset command
// - Request data: passwordResetCode, password
// - Response data: resetDone
userRoutes.post("/resetPassword", (request, response) => {
	var payload = request.body;
	var passwordResetCode = payload.passwordResetCode;
	var newPassword = payload.password;

	var user;
	User.getByPasswordResetCode(passwordResetCode)
		.then(foundUser => {
			user = foundUser;
			user.saveNewPassword(newPassword);
		})
		.then(result => user.newPasswordResetCode(""))
		.then(result => user.eraseData())
		.then(result => {
			response.sendResult({resetDone: result});
		})
		.catch(error => {
			response.sendError(error.message);
		});
});

// Edit info command
// - Authorization required: email, token
// - Request data: data, encryptedData
// - Response data: edited
userRoutes.post("/editInfo", tokenAuth, (request, response) => {
	var user = response.locals.user;

	var payload = request.body;
	var data = payload.data;
	var encryptedData = payload.encryptedData;

	user.updateData(data, encryptedData)
		.then(result => {
			response.sendResult({edited: "true"});
		})
		.catch(error => {
			console.log(error);
			response.sendError("SERVER_ERROR");
		});
});

// Validate password command
// - Authorization required: email, token
// - Request data: password
// - Response data: validated
userRoutes.post("/validatePassword", tokenAuth, (request, response) => {
	var user = response.locals.user;
	var payload = request.body;
	var password = payload.password;

	user.validatePassword(password)
		.then(result => {
			response.sendResult({ validated: result });
		})
		.catch(error => {
			if (error.message === "INCORRECT_PASSWORD") {
				response.sendError("INCORRECT_PASSWORD");
			} else {
				console.log(error);
				response.sendError("SERVER_ERROR");
			}
		});
});


// Set first password command
// - Authorization required: email, token
// - Request data: password
// - Response data: passwordSet
userRoutes.post("/setFirstPassword", tokenAuth, (request, response) => {
	var payload = request.body;
	var user = response.locals.user; 

	var password = payload.password;
	var currentToken = payload.token;

	if (user.password === null || user.password === undefined) { // only set if initially null
		user.saveNewPassword(password, currentToken)
			.then(result => {
				response.sendResult({ passwordSet: true });
			})
			.catch((error) => {
				response.sendError(error.message);
			});
	} else {
		response.sendError("PASSWORD_ALREADY_SET");
	}
});

// Link existing user account with Facebook
// - Request data: email, password
// - Response data: linked
userRoutes.post("/linkFacebook", (request, response) => {
	var payload = request.body;

	var email = payload.email;
	var password = payload.password;

	var user;
	User.getByEmail(email)
		.then(fetchedUser => {
			user = fetchedUser;
			return user.validatePassword(password);
		})
		.then(result => user.setFacebookConfirmed())
		.then(result => user.newToken(request))
		.then(token => {
			response.sendResult({ linked: true, token: token });
		})
		.catch(error => {
			if (error.message === "INCORRECT_PASSWORD")
				response.sendError("INCORRECT_PASSWORD");
			else {
				console.log(error);
				response.sendError("SERVER_ERROR");
			}
		});
});

// Revoke link with Facebook
// - Authorization required: email, token
// - Request data: none
// - Response data: revoked
userRoutes.post("/revokeFacebook", tokenAuth, (request, response) => {
	var user = response.locals.user;

	user.saveFacebookId(null)
		.then(result => {
			response.sendResult({ revoked: result });
		})
		.catch(error => {
			console.log(error);
			response.sendError("SERVER_ERROR");
		});
});

// Get additional token, without revoking current one
// - Authorization required: token
// - Request data: none
// - Response data: revoked
userRoutes.post("/getNewToken", tokenAuth, (request, response) => {
	var user = response.locals.user;

	user.newToken(request)
		.then(token =>{
			response.sendResult({token : token});
		})
		.catch(error => {
			console.log(error);
			response.sendError("SERVER_ERROR");
		});
});

module.exports = userRoutes;