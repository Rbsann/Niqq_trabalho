// npm modules imports
var mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

// local modules imports
var general = require('../general.js');

var Schema = mongoose.Schema;

mongoose.Promise = global.Promise;

var userSchema = new Schema({
	email: { type: String, required: true, unique: true, maxlength: 50 },
	password: { type: String, required: false, maxlength: 100 },
	session: { type: [String] },
	facebook: { 
		id: { type: String, unique: true },
		pictureURL : {type: String, maxlength: 200 },
		confirmed: {type: Boolean, default: false }
	},
	emailConfirmed: {type: Boolean, default: false},
	emailConfirmationCode: {type: String, maxlength: 100},
	passwordResetCode: {type: String, maxlength: 100},
	role: { type: String, default: "user" }, // user, catalogger, admin
	signedUp: { type: Date },
	credentials: [{
		url: String,
		login: String,
		password: String
	}],
	data: {
		name: {
			first: { type: String, maxlength: 50 }
		},
		CPF: { type: String, required: false, unique: false, maxlength: 15 },
		cellphone: {
			type: [{
				country: { type: String, maxlength: 3 },
				area: { type: String, maxlength: 10 },
				number: { type: String, maxlength: 20 }
			}], validate: [arrayLimit, '{PATH} exceeds the limit of 5']
		},
		DOB: {
			day: { type: String, maxlength: 2},
			month: { type: String, maxlength: 2 },
			year: { type: String, maxlength: 4 }
		},
		gender: { type: String, maxlength: 30 }
	},
	encryptedData: {
		name: {
			last: { type: String, maxlength: 400 }
		},
		RG: { type: String, required: false, maxlength: 100 },
		address: {
			type: [{
				type: { type: String, maxlength: 50 },          // casa, comercial, apartamento
				street: { type: String, maxlength: 300 },
				number: { type: String, maxlength: 50 },
				complement: { type: String, maxlength: 100 },
				ZIP: { type: String, maxlength: 100 },
				city: { type: String, maxlength: 200 },
				neighborhood: { type: String, maxlength: 200 },
				state: { type: String, maxlength: 200 }
			}], validate: [arrayLimit, '{PATH} exceeds the limit of 5']
		},
		phone: {
			type: [{
				country: { type: String, maxlength: 100 },
				area: { type: String, maxlength: 100 },
				number: { type: String, maxlength: 200 }
			}], validate: [arrayLimit, '{PATH} exceeds the limit of 5']
		}
	}
});

function arrayLimit(val) {
	return val.length <= 5;
}

// update user data to lastest schema version
userSchema.methods.updateSchema = function() {
	return new Promise ((resolve, reject) => {
		var changed = false;

		var data = this.data.toObject();
		var encryptedData = this.encryptedData.toObject();
		
		if (this.data.name.first === undefined) {
			this.data.name = { first: data.firstName };
			changed = true;
			//console.log( "changed name");
		}

		if (this.encryptedData.name.last === undefined) {
			this.encryptedData.name = { last: encryptedData.lastName };
			changed = true;
			//console.log( "changed lastname");
		}

		if (typeof data.DOB === "string") {
			var dob = data.DOB.split("/");
			this.data.DOB = {
				day: dob[0],
				month: dob[1],
				year: dob[2]
			};
			changed = true;
			//console.log( "changed dob");
		}

		if (this.data.gender === "m") {
			this.data.gender = "male";
			changed = true;
		}

		if (this.data.gender === "f") {
			this.data.gender = "female";
			changed = true;
		}

		if (this.data.gender === "o") {
			this.data.gender = "other";
			changed = true;
		}

		if (this.facebookId) {
			this.facebook.id = this.facebookId;
			this.facebook.confirmed = true;
		}

		if (changed) {
			this.save()
				.then(() => {
					// console.log("updated schema");
					resolve(true);
				})
				.catch((error) => {
					reject(error);
				});
		} else {
			resolve(true);
		}

	});
};


userSchema.methods.validatePassword = function(password) {
	return new Promise((resolve, reject) => {
		bcrypt.compare(password, this.password)
			.then(result => {
				if (result) {
					resolve(true);
				} else {
					reject(Error("INCORRECT_PASSWORD"));
				}
			})
			.catch(error => {
				reject(error);
			});
	});
};

userSchema.methods.saveNewPassword = function(newPassword, currentToken = null) {
	return new Promise((resolve, reject) => {
		var rounds = 13;
		bcrypt.hash(newPassword, rounds)
			.then(newPasswordHash => {
				this.password = newPasswordHash;
				this.session = []; // invalidate all access tokens
				if (currentToken !== null)
					this.session.push(currentToken); // re-save current token if provided
			})
			.then(() => this.save())
			.then(() => {
				resolve(true);
			})
			.catch(error => {
				reject(error);
			});
	});
};

userSchema.methods.saveFacebookId = function(facebookId) {
	return new Promise((resolve, reject) => {
		this.facebook.id = facebookId;
		this.facebook.confirmed = false;
		this.save()
			.then(() => {
				resolve(true);
			})
			.catch(error => {
				reject(error);
			});
	});
};

userSchema.methods.saveFacebookPictureURL = function(pictureURL) {
	return new Promise((resolve, reject) => {
		this.facebook.pictureURL = pictureURL;
		this.save()
			.then(() => {
				resolve(true);
			})
			.catch(error => {
				reject(error);
			});
	});
};

userSchema.methods.updateData = function(newData, newEncryptedData) {
	return new Promise((resolve, reject) => {
		if (newData !== null)
		 	general.updateObjectData(this.data, newData);
		if (newEncryptedData !== null)
			general.updateObjectData(this.encryptedData, newEncryptedData);

		this.save()
			.then(() => {
				resolve(true);
			})
			.catch(error => {
				reject(error);
			});
	});
};

userSchema.methods.eraseData = function() {
	return new Promise((resolve, reject) => {
		this.data.CPF = "";
		this.data.cellphone = [];
		this.data.DOB = {};
		this.data.gender = "";
		this.encryptedData = {};
		this.encryptedData.phone = [];
		this.encryptedData.address = [];
		this.save()
			.then(() => {
				resolve(true);
			})
			.catch((error) => {
				reject(error);
			});
	});
};

// revoke all tokens of a dynasty
userSchema.methods.killTokenDynasty = function(dynasty) {
	return new Promise((resolve, reject) => {
		var activeTokens = this.session.slice(); // copy active tokens
		activeTokens.forEach(token => {
			general.authenticateToken(token)
				.then(tokenPayload => {
					if (tokenPayload.dynasty === dynasty) {
						this.revokeToken(token);
					}
				})
				.catch(error => {
					console.log(error);
				});
		});
		
		resolve(true);
	});
};

userSchema.methods.newToken = function(req = null, dynasty = null) {
	return new Promise((resolve, reject) => {
		var token;
		var tokenPayload = {
			email: this.email,
			dynasty: dynasty || crypto.createHmac('sha256', this.email).update(Math.random().toString(36)).digest('hex').substr(0, 10)
		};

		if (req !== undefined && req !== null) {
			tokenPayload.ip = req.getIPAddress();
			tokenPayload.userAgent = req.getUserAgent();
		}

		general.generateToken(tokenPayload)
			.then(generatedToken => {
				token = generatedToken;
				this.session.push(token);
			})
			.then(() => this.save())
			.then(() => {
				resolve(token);
			})
			.catch((error) => {
				reject(error);
			});
	});
};

userSchema.methods.revokeToken = function(revokedToken) {
	return new Promise((resolve, reject) => {
		var revokedTokenIndex = this.session.findIndex(token => token === revokedToken);
		if (revokedTokenIndex > -1) {
			this.session.splice(revokedTokenIndex, 1);
			this.save()
				.then(() => {
					resolve(true);
				})
				.catch((error) => { 
					reject(error);
				});
		} else {
			reject(Error("INVALID_TOKEN"));
		}
	});
};

userSchema.methods.isValidToken = function(token) {
	return new Promise((resolve, reject) => {
		if (this.session.find(validToken => validToken === token) === token) {
			resolve(true);
		} else {
			reject(Error("INVALID_TOKEN"));
		}
	});
};

userSchema.methods.isPasswordSet = function() {
	return new Promise((resolve, reject) => {
		if (this.password !== undefined && this.password !== null && this.password !== "") {
			resolve(true);
		} else {
			reject(Error("PASSWORD_NOT_SET"));
		}
	});
};

userSchema.methods.isFacebookConfirmed = function() {
	return new Promise((resolve, reject) => {
		if (this.facebook.confirmed !== undefined && this.facebook.confirmed === true) {
			resolve(true);
		} else {
			reject(Error("FACEBOOK_NOT_CONFIRMED"));
		}
	});
};

userSchema.methods.setFacebookConfirmed = function() {
	return new Promise((resolve, reject) => {
		this.facebook.confirmed = true;
		this.save()
			.then(() => {
				resolve(true);
			})
			.catch((error) => { 
				reject(error);
			});
	});
};

userSchema.methods.newPasswordResetCode = function(code = null) {
	return new Promise((resolve, reject) => {
		if (code === null) {
			this.passwordResetCode = crypto.createHmac('sha256', this.email).update(Math.random().toString(36)).digest('hex');
		} else {
			this.passwordResetCode = code;
		}
		
		this.save()
			.then(() => {
				resolve(this.passwordResetCode);
			})
			.catch((error) => {
				reject(error);
			});
	});
};

userSchema.methods.newEmailConfirmationCode = function(code = null) {
	return new Promise((resolve, reject) => {
		if (code === null) {
			this.emailConfirmationCode = crypto.createHmac('sha256', this.email).update(Math.random().toString(36)).digest('hex');
		} else {
			this.emailConfirmationCode = code;
		}

		this.emailConfirmed = false;

		this.save()
			.then(() => {
				resolve(this.emailConfirmationCode);
			})
			.catch(error => {
				reject(error);
			});
	});
};

userSchema.methods.setNewEmail = function(email) {
	return new Promise((resolve, reject) => {
		this.email = email;
		this.newEmailConfirmationCode()
			.then(code => {
				resolve(code);
			})
			.catch(error => {
				reject(error);
			});
	});
};

userSchema.methods.confirmEmail = function() {
	return new Promise((resolve, reject) => {
		if (this.emailConfirmed === false) {
			this.emailConfirmed = true;
			this.emailConfirmationCode = "";
			this.save()
				.then(_ => resolve(true))
				.catch(error => reject(error));
		} else {
			reject(Error("EMAIL_ALREADY_CONFIRMED"));
		}
	});
};

userSchema.methods.findCredential = function(url) {
	return new Promise((resolve, reject) => {
		var credential = this.credentials.find(credential => credential.url === url);
		if (credential) {
			resolve(credential);
		} else {
			reject(Error("CREDENTIAL_URL_NOT_FOUND"));
		}
	});
};

userSchema.methods.findAllCredentials = function(url) {
	return new Promise((resolve, reject) => {
		// remove passwords and _ids from credentials array
		resolve(this.credentials.map(credential => ({url: credential.url, login: credential.login})));
	});
};

userSchema.methods.addCredential = function(url, login, password) {
	return new Promise((resolve, reject) => {
		this.findCredential(url)
			.then(credential => {
				reject(Error("CREDENTIAL_URL_ALREADY_EXISTS"));
			})
			.catch(error => {
				if (error.message === "CREDENTIAL_URL_NOT_FOUND") {
					this.credentials.push({
						url: url,
						login: login,
						password: password
					});
					return this.save();
				}
			})
			.then(_ => resolve(true))
			.catch(error => reject(error));
	});
};

userSchema.methods.updateCredential = function(url, login, password) {
	return new Promise((resolve, reject) => {
		this.findCredential(url)
			.then(credential => {
				credential.login = login;
				credential.password = password;
				return this.save();
			})
			.then(_ => resolve(true))
			.catch(error => reject(error));
	});
};

userSchema.methods.removeCredential = function(url) {
	return new Promise((resolve, reject) => {
		var credentialIndex = this.credentials.findIndex(credential => credential.url === url);
		if (credentialIndex > -1) {
			this.credentials.splice(credentialIndex, 1);
			this.save()
				.then(() => {
					resolve(true);
				})
				.catch((error) => { 
					reject(error);
				});
		} else {
			reject(Error("CREDENTIAL_URL_NOT_FOUND"));
		}
	});
};

userSchema.methods.removeAllCredentials = function() {
	return new Promise((resolve, reject) => {
		this.credentials = [];
		this.save()
			.then(_ => resolve(true))
			.catch(error => reject(error));
	});
};

userSchema.methods.replaceAllCredentials = function(credentials) {
	return new Promise((resolve, reject) => {
		this.credentials = [];
		credentials.forEach(credential => {
			this.credentials.push({
				url: credential.url,
				login: credential.login,
				password: credential.password
			});
		});
		this.save()
			.then(_ => resolve(true))
			.catch(error => reject(error));
	});
};

module.exports = mongoose.model('user', userSchema);


// Promise de procurar usuário no banco, mas se não achar, retorna erro
module.exports.search = function (params) {
	return new Promise((resolve, reject) => {

		this.findOne(params)
			.then((person) => {
				if (person === null) {
					reject(Error("USER_NOT_FOUND"));
				} else {
					person.updateSchema()
						.then(() => {
							resolve(person); // Passa person para próxima Promise
						})
						.catch((error) => {
							console.log(error);
							reject(error); // reject if schema update was unsuccessful
						});
				}
			})
			.catch((error) => {
				reject(error);
			});
	});
};


// Get user by email
module.exports.getByEmail = function (email) {
	return new Promise((resolve, reject) => {
		if (email !== undefined && email !== null && email !== "") {
			var params = {
				email: email
			};
			module.exports.search(params)
				.then(result => {
					resolve(result);
				})
				.catch(error => {
					if (error.message === "USER_NOT_FOUND")
						reject(Error("USER_NOT_FOUND"));
					else {
						console.log(error);
						reject(Error("SERVER_ERROR"));
					}
				});
		} else {
			reject(Error("INVALID_EMAIL"));
		}
	});
};

// Get user by password reset code
module.exports.getByPasswordResetCode = function (code) {
	return new Promise((resolve, reject) => {
		if (code !== undefined && code !== null && code !== "") {
			var params = {
				passwordResetCode: code
			};

			module.exports.search(params)
				.then(result => {
					resolve(result);
				})
				.catch(error => {
					if (error.message === "USER_NOT_FOUND")
						reject(Error("USER_NOT_FOUND"));
					else {
						console.log(error);
						reject(Error("SERVER_ERROR"));
					}
				});

		} else {
			reject(Error("INVALID_CODE"));
		}
	});
};

// Get user by email confirmation code
module.exports.getByEmailConfirmationCode = function (code) {
	return new Promise((resolve, reject) => {
		if (code !== undefined && code !== null && code !== "") {
			var params = {
				emailConfirmationCode: code
			};

			module.exports.search(params)
				.then(result => {
					resolve(result);
				})
				.catch(error => {
					if (error.message === "USER_NOT_FOUND")
						reject(Error("USER_NOT_FOUND"));
					else {
						console.log(error);
						reject(Error("SERVER_ERROR"));
					}
				});

		} else {
			reject(Error("INVALID_CODE"));
		}
	});
};

// Get user by facebook id
module.exports.getByFacebookId = function (facebookId) {
	return new Promise((resolve, reject) => {
		if (facebookId !== undefined && facebookId !== null && facebookId !== "") {
			var params = {
				'facebook.id': facebookId
			};

			module.exports.search(params)
				.then(result => {
					resolve(result);
				})
				.catch(error => {
					if (error.message === "USER_NOT_FOUND")
						reject(Error("USER_NOT_FOUND"));
					else {
						console.log(error);
						reject(Error("SERVER_ERROR"));
					}
				});

		} else {
			reject(Error("INVALID_FACEBOOK_ID"));
		}
	});
};

// Get array of users
module.exports.getList = function (params) {
	return new Promise((resolve, reject) => {
		this.find({}).select({email: 1, "data.name.first": 1, signedUp: 1}).sort({signedUp: -1})
			.then(users => {
				resolve(users);
			})
			.catch((error) => {
				reject(error);
			});
	});
};