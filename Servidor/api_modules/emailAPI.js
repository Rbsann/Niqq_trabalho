// Module imports
const ejs = require('ejs');
const fs = require('fs');
const RateLimit = require('express-rate-limit');
const nodemailer = require('nodemailer');
const tokenAuth = require('./tokenAuth.js');
const general = require('../general.js');

const emailRoutes = require('express').Router();
var User = require('../models/user.js');

const senderNiqq = '"Niqq" <niqq@niqq.in>';
const senderNiqqHelp = '"Niqq" <help@niqq.in>';

// SMTP transport object
let transporter = nodemailer.createTransport({
	service: 'Yandex',
	auth: {
		user: 'niqq@niqq.in',
		pass: 'zLvu#7ZT-4!t&qpsASzp'
	}
});

var emailAPILimiter = new RateLimit({
	windowMs: 20 * 60 * 1000, // 20 minute window
	max: 20, // requests per windowMs
	delayAfter: 10,
	delayMs: 1000
});

emailRoutes.use(emailAPILimiter);

// Teste de template de email
emailRoutes.get("/testEmail", (request, response) => {
	response.render("confirmationEmail.ejs", {name: "Thiago", confirmationURL: "https://niqq.in/"});
});

// Send message from user to help@niqq.in
// - Authorization required: email, token
// - Request data: message
// - Response data: emailSent
emailRoutes.post("/sendHelp", tokenAuth, (request, response) => {
	var user = response.locals.user;
	var payload = request.body;

	var email = user.email;
	var message = email + ":  " + payload.message;
	sendEmail([email, 'help@niqq.in', 'Mensagem de Fale Conosco de ' + email, message])
		.then(() => {
			response.sendResult({emailSent: true});
		})
		.catch((error) => {
			console.log(error);
			response.sendError("SERVER_ERROR");
		});
});

module.exports = emailRoutes;

module.exports.sendPasswordResetEmail = function(name, email, passwordResetCode) {

    const emailTemplate = fs.readFileSync(__dirname + '/../views/resetPasswordEmail.ejs', 'utf8'); 

	var resetURL = general.getWebsiteURL() + "recuperar-senha/#" + passwordResetCode;

	var emailContents = ejs.render(emailTemplate, {name: name, resetURL: resetURL});

	sendEmail([senderNiqqHelp, email, "Redefinição de senha", emailContents]);
};

module.exports.sendConfirmationEmail = function(name, email, confirmationCode) {
    const emailTemplate = fs.readFileSync(__dirname + '/../views/confirmationEmail.ejs', 'utf8'); 

	var confirmationURL = general.getWebsiteURL() + "confirmar-email/#" + confirmationCode;

	var emailContents = ejs.render(emailTemplate, {name: name, confirmationURL: confirmationURL});
	
	sendEmail([senderNiqqHelp, email, "Confirmação de e-mail", emailContents]);
};

// Envia email 
var sendEmail = function ([from, to, subject, message]) {
	return new Promise((resolve, reject) => {

		// email data
		let mailOptions = {
			from: senderNiqq, // sender address
			replyTo: from, // reply to address
			to: to, // list of receivers
			subject: subject, // Subject line
			//text: 'Hello world ?', // plain text body
			html: message // html body
		};

		// send mail if production environment
		if (general.isProductionEnvironment()) {
			transporter.sendMail(mailOptions, (error, info) => {
				if (error) {
					// console.log(error);
					reject(error);
				} else {
					// console.log('Message %s sent: %s', info.messageId, info.response);
					resolve(true);
				}
			});
		} else {
			console.log("Sending email:");
			console.log(mailOptions);
			resolve(true);
		}
		
	});
};