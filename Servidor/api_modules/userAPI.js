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
// - Request data: currentPassword, newPassword, encryptedData, credentials
// - Response data: changed
userRoutes.post("/changePassword", tokenAuth, (request, response) => {
	var user = response.locals.user;
	var payload = request.body;

	var currentToken = payload.token;

	var currentPassword = payload.currentPassword;
	var newPassword = payload.newPassword;
	var encryptedData = payload.encryptedData;
	var credentials = payload.credentials || [];

	user.validatePassword(currentPassword)
		.then(_ => user.saveNewPassword(newPassword, currentToken))
		.then(_ => user.updateData(null, encryptedData))
		.then(_ => user.replaceAllCredentials(credentials))
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
		.then(_ => user.removeAllCredentials())
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


/////////////////////////////////////////////////////////////////////
// Password manager API calls
//

// Add new credential
// - Authorization required: token
// - Request data: url, login, password
// - Response data: added
userRoutes.post("/addCredential", tokenAuth, (request, response) => {
	var user = response.locals.user;

	var payload = request.body;
	var url = payload.url;
	var login = payload.login;
	var password = payload.password;

	user.addCredential(url, login, password)
		.then(_ => {
			response.sendResult({ added: true });
		})
		.catch(error => {
			if (error.message === "CREDENTIAL_URL_ALREADY_EXISTS") {
				response.sendError("CREDENTIAL_URL_ALREADY_EXISTS");
			} else {
				console.log(error);
				response.sendError("SERVER_ERROR");
			}
		});
	
});

// Get previously saved credential
// - Authorization required: token
// - Request data: url
// - Response data: credential: {url, login, password}
userRoutes.post("/getCredential", tokenAuth, (request, response) => {
	var user = response.locals.user;

	var payload = request.body;
	var url = payload.url;

	user.findCredential(url)
		.then(credential => {
			response.sendResult({ 
				credential: {
					url: credential.url,
					login: credential.login,
					password: credential.password
				}
			});
		})
		.catch(error => {
			if (error.message === "CREDENTIAL_URL_NOT_FOUND") {
				response.sendError("INVALID_CREDENTIAL_URL");
			} else {
				console.log(error);
				response.sendError("SERVER_ERROR");
			}
		});
	
});

// Get array of credentials
// - Authorization required: token
// - Request data: -
// - Response data: credentials: [{url, login}]
userRoutes.post("/getAllCredentials", tokenAuth, (request, response) => {
	var user = response.locals.user;
	user.findAllCredentials()
		.then(credentials =>  {
			response.sendResult({
				credentials: credentials
			});
		})
		.catch(error => {
			console.log(error);
			response.sendError("SERVER_ERROR");
		});
});

// Update credential
// - Authorization required: token
// - Request data: url, login, password
// - Response data: updated
userRoutes.post("/updateCredential", tokenAuth, (request, response) => {
	var user = response.locals.user;

	var payload = request.body;
	var url = payload.url;
	var login = payload.login;
	var password = payload.password;

	user.updateCredential(url, login, password)
		.then(_ => {
			response.sendResult({ updated: true });
		})
		.catch(error => {
			if (error.message === "CREDENTIAL_URL_NOT_FOUND") {
				response.sendError("INVALID_CREDENTIAL_URL");
			} else {
				console.log(error);
				response.sendError("SERVER_ERROR");
			}
		});
});

// Remove credential
// - Authorization required: token
// - Request data: url
// - Response data: removed
userRoutes.post("/removeCredential", tokenAuth, (request, response) => {
	var user = response.locals.user;

	var payload = request.body;
	var url = payload.url;

	user.removeCredential(url)
		.then(_ => {
			response.sendResult({ removed: true });
		})
		.catch(error => {
			if (error.message === "CREDENTIAL_URL_NOT_FOUND") {
				response.sendError("INVALID_CREDENTIAL_URL");
			} else {
				console.log(error);
				response.sendError("SERVER_ERROR");
			}
		});
});

module.exports = userRoutes;