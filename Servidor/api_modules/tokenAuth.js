var User = require('../models/user.js');
var General = require('../general.js');

var sendResponseUnauthorized = function (response) {
	response.status(401).end();
};

var tokenRenewalAge = 1800; // 30 minutes in seconds
var tokenExpirationAge = 604800; // 1 week in seconds

module.exports = function (req, res, next) {
	var token = req.body.token;
	var user, tokenPayload;

	General.authenticateToken(token)
		.then(payload => {
			tokenPayload = payload;
			return User.getByEmail(payload.email);
		})
		.then(foundUser => {
			user = foundUser;
			return user.isValidToken(token);
		})
		.then(result => {
			var tokenAge = Date.now() / 1000 - tokenPayload.iat; // seconds since token was issued
			if (tokenAge > tokenExpirationAge) { // token has expired
				return user.revokeToken(token)
					.then(result => {
						throw Error("TOKEN_EXPIRED");
					});
			} else if (tokenAge > tokenRenewalAge) { // token is due for renewal
				return user.newToken(req, tokenPayload.dynasty) // issue new token, but preserve dynasty
					.then(token => {
						res.locals.newToken = token; // set res variable
					})
					.then(() => user.revokeToken(token)) // revoke old token
					.catch(error => {
						console.log(error);
						throw error;
					});
			}
		})
		.then(() => {
			res.locals.user = user;
			next();
		})
		.catch(error => {
			if(req.baseUrl !== '/event'){
				if (error.message === "INVALID_TOKEN") { // if token was authenticated but is revoked, revoke dynasty
				user.killTokenDynasty(tokenPayload.dynasty)
					.catch(error => console.log(error));
				}
				sendResponseUnauthorized(res);
			}
			next();
		});
};