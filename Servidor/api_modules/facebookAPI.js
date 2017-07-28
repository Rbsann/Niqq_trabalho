var passport = require('passport');
var FacebookStrategy = require('passport-facebook').Strategy;
var general = require('../general.js');
const RateLimit = require('express-rate-limit');

const facebookRoutes = require('express').Router();
var User = require('../models/user.js');


var facebookAPILimiter = new RateLimit({
	windowMs: 10 * 60 * 1000, // 10 minute window
	max: 40, // requests per windowMs
	delayAfter: 25,
	delayMs: 1000
});

facebookRoutes.use(facebookAPILimiter);


// --------------------------------------------------------------------------------
// Passport configuration
// --------------------------------------------------------------------------------
var fbCredentials = general.getFacebookCredentials();

passport.use(new FacebookStrategy({
	clientID: fbCredentials.clientID,
	clientSecret: fbCredentials.clientSecret,
	callbackURL: general.getServerPathSlash() + 'auth/fb/return',
	profileFields: ['id', 'first_name', 'last_name', 'email', 'gender', 'picture.type(normal)'] //, 'birthday'
}, function (accessToken, refreshToken, profile, done) {
	// extract data from profile
	var email = profile._json.email;
	var facebookId = profile._json.id;
	var pictureData = profile._json.picture.data;
	var pictureURL = (pictureData !== undefined && !pictureData.is_silhouette) ? pictureData.url : null;
	// var birthday = new Date(profile._json.birthday); // MM/DD/YYYY
	var data = {
		name: { first: profile._json.first_name },
		gender: profile._json.gender,
		cellphone: [{}],
		// DOB: {
		// 	day: birthday.getDate(),
		// 	month: birthday.getMonth(),
		// 	year: birthday.getFullYear()
		// }
	};
	var user;
	// find or create user and set facebook picture
	User.getByFacebookId(facebookId)
		.then(userFound => {
			user = userFound;
			throw Error("USER_FOUND"); // jump to the end of the chain
		})
		.catch(error => {
			if (error.message === "USER_NOT_FOUND")
				return User.getByEmail(email); // try to find user by email
			throw error; // pass error along if unexpected
		})
		.then(userFound => {
			user = userFound;
			user.saveFacebookId(facebookId); // set Facebook ID if e-mail is already signed up
			throw Error("USER_FOUND"); // jump to the end of the chain
		})
		.catch(error => {
			if (error.message === "USER_NOT_FOUND") { // create new user if Facebook ID and e-mail are not signed up
				user = new User();
				return user.setNewEmail(email)
					.then(() => user.saveFacebookId(facebookId))
					.then(() => user.setFacebookConfirmed())
					.then(() => user.updateData(data, null))
					.then(() => {
						throw Error("USER_FOUND"); // jump to the end of the chain
					})
					.catch(error => {
						throw error;
					});
			}
			throw error; // pass error along if unexpected
		})
		.catch(error => {
			if (error.message === "USER_FOUND") {
				if (pictureURL !== null)
					user.saveFacebookPictureURL(pictureURL); // always update picture URL on login
				done(null, user);
			} else {
				console.log(error);
				done(Error("SERVER_ERROR"), null);
			}
		});
}));

var authenticateFB = function () {
	return passport.authenticate('facebook', { failureRedirect: general.getServerPathSlash() + 'auth/fb/cancel', scope: ['public_profile', 'email'] }); //, 'user_birthday'
};

// not used in this implementation
passport.serializeUser(function (user, cb) {
	cb(null, true);
});
// passport.deserializeUser(function (obj, cb) {
// 	cb(null, true);
// });

// --------------------------------------------------------------------------------
// facebookRoutes configuration
// --------------------------------------------------------------------------------
// Facebook authentication middleware
facebookRoutes.use(passport.initialize());
// facebookRoutes.use(passport.session()); // not used in this implementation

// Initiate Facebook login
facebookRoutes.get('/', authenticateFB());

// Facebook login callback
facebookRoutes.get('/return',
	authenticateFB(),
	fbReturnHandler,
	function (err, req, res, next) {
		if (err !== 100) {
			console.log(err);
		}
		res.redirect(general.getServerPathSlash() + 'auth/fb/cancel');
	}
);

// Cancel Facebook login
facebookRoutes.get('/cancel', function (request, response) {
	var message = {
		extensionId: general.getExtensionId(),
		data: { type: "EXT_LOGIN_FB_CANCEL" }
	};

	response.render('extensionMessage', { message: message });
});


// Check Facebook login state and inform extension accordingly
function fbReturnHandler(request, response) {
	var user = request.user;

	var message = {
		extensionId: general.getExtensionId(),
		data: {
			type: null,
			token: null,
			firstName: user.data.name.first,
			email: user.email,
			pictureURL: user.facebook.pictureURL
		}
	};

	user.isFacebookConfirmed()
		.catch(error => {
			if (error.message === "FACEBOOK_NOT_CONFIRMED") {
				message.data.type = "EXT_LINK_FB";
				response.render('extensionMessage', { message: message });
			}
			throw error;
		})
		.then(result => user.isPasswordSet())
		.then(result => {
			message.data.type = "EXT_LOGIN_FB";
			return user.newToken(request);
		})
		.catch(error => {
			if (error.message === "PASSWORD_NOT_SET") {
				message.data.type = "EXT_LOGIN_FB_FIRST";
				return user.newToken(request);
			} else {
				throw error;
			}
		})
		.then(token => {
			message.data.token = token;
			response.render('extensionMessage', { message: message });

		})
		.catch(error => {
			if (error.message !== "FACEBOOK_NOT_CONFIRMED") {
				console.log(error);
				response.render('extensionMessage', { message: { type: "EXT_LOGIN_ERROR" } });
			}
		});
}

// export facebookRoutes
module.exports = facebookRoutes;