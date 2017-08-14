const express = require('express');
const router = express.Router();
const knex = require('../relational_db.js');//editar nome da file
const deasync = require('deasync-promise');

const moment = require('moment');// package pra calcular a demora pra usar a extensao
const Events = require('./event.js');
const Users = require('./user.js');

const signupPages = ["SignupFormPage", "FractionedSignupPage"];

//TODO: mudar para nome que explica melhor o que a função faz
function formsCompared() {
	return new Promise((resolve, reject) => {
		var result = {}; // dicionário com contagem de eventos no formato: {página: Number}
		// executa paralelamente as promises do vetor de promises retornado pelo .map e resolve um vetor com as resoluções delas só depois de todas terminarem
		Promise.all(signupPages.map(page => {
		    return knex().count('action').where({ category: page, action: 'signupCompletedWithDownload' }).from('event')
		        .then(count => { 
		            result[page] = count[0]["count(`action`)"]; // coloca contagem no dicionário de resultado
		        });
		}))
		    .then(_ => resolve(result))
		    .catch(error => reject(error));

		// código equivalente sem uso de map
		// Promise.all([
		// 	knex().count('action').where({ category: "FractionedSignupPage", action: 'signupCompletedWithDownload' }).from('event')
		// 		.then(count => {
		// 			result.FractionedSignupPage = count[0]["count(`action`)"];
		// 		}),
		// 	knex().count('action').where({ category: "SignupFormPage", action: 'signupCompletedWithDownload' }).from('event')
		// 		.then(count => {
		// 			result.SignupFormPage = count[0]["count(`action`)"];
		// 		})
		// ])
		// 	.then(_ => resolve(result))
		// 	.catch(error => reject(error));


	});
}

//TODO: transformar em promise usando Promise.all e map sobre o array de actions
function fracSignup() {
	return new Promise((resolve, reject) => {
		var actions = ['pageView', 'endSignupStep1', 'endSignupStep2', 'signupCompletedWithDownload', 'signupCompletedWithoutDownload'];
		resolve({pageView: 0, endSignupStep1: 0, endSignupStep2: 0, signupCompletedWithDownload: 0, signupCompletedWithoutDownload: 0}); //TODO: resolver nesse formato
	});
	

	// var pView, step1, step2, down, notDown;
	// knex('event').where({ category: 'formSignup', action: 'pageView' }).count('action').then(function (contagem4) {
	// 	pView = contagem4;
	// 	knex('event').where({ category: 'formSignup', action: 'endSignupStep1' }).count('action').then(function (contagem5) {
	// 		step1 = contagem5;
	// 		knex('event').where({ category: 'formSignup', action: 'endSignupStep2' }).count('action').then(function (contagem6) {
	// 			step2 = contagem6;
	// 			knex('event').where({ category: 'formSignup', action: 'signupCompletedWithDownload' }).count('action').then(function (contagem7) {
	// 				down = contagem7;
	// 				knex('event').where({ category: 'formSignup', action: 'signupCompletedWithoutDownload' }).count('action').then(function (contagem8) {
	// 					notDown = contagem8;
	// 					return [pView, step1, step2, down, notDown];
	// 				});
	// 			});
	// 		});
	// 	});
	// });
}

// promise que resolve ("retorna") uma lista de emails de usuarios que deram fill e signupcompletedwithdownload
function findActiveUserEmails() {
	return new Promise((resolve, reject) => {
		knex().select('email').from('event').where({ action: 'fill' }).distinct('email')
			.then(emails => { // função que recebe vetor de linhas do banco cujos emails deram fill
				return Promise.all(emails.map(email => { // ver uso de map na função extension
					return knex().select('email').from('event').where({ email: email.email, action: 'signupCompletedWithDownload' })
						.then(event => {
							return event[0].email; // retorna string do email para o Promise.all
						})
						.catch(error => reject(error));
				}));
			})
			.then(activeUserEmails => { // resultado do Promise.all é um vetor com os emails do usuários que fizeram download
				resolve(activeUserEmails); // resultado final da promise retornada pela função findActiveUserEmails
			})
			.catch(error => {
				reject(error);
			});
	});
}

//TODO: transformar em promise usando como base a função findActiveUserEmails e extension
function getTimestamps(activeUserEmails) {
	return new Promise((resolve, reject) => {
		resolve("dataTot");
	});
	// let dataTot = [], dataFill = [], dataSignup = [];

	// for (let i = 0; i < validUsers.length; i++) {
	// 	let datefill = deasync(knex('event').where({ email: validUsers[i].email, action: 'fill' }).min('timestamp'));
	// 	dataFill.push((datefill[0])['min(`timestamp`)']);

	// 	let dateSignup = deasync(knex('event').where({ email: validUsers[i].email, action: 'signupCompletedWithDownload' }).select('timestamp'));
	// 	dataSignup.push((dateSignup[0].timestamp));

	// 	dataTot[i] = moment(dataFill[i]).diff(dataSignup[i], 'minutes');
	// }

	// return dataTot; //TODO: pensar em nome melhor
}

function fill() {
	return new Promise((resolve, reject) => {
		// executas as promises findActiveUserEmails e getTimestamps sequencialmente, sendo que a getTimestamps recebe o que a findActiveUserEmails resolveu
		findActiveUserEmails()
			.then(getTimestamps)
			.then(dataTot => {
				resolve(dataTot);
			})
			.catch(error => console.log(error));
	});
}
	
module.exports.fill = fill;
module.exports.formsCompared  = formsCompared;
module.exports.fracSignup = fracSignup;