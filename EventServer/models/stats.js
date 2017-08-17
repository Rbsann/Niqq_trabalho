const express = require('express');
const router = express.Router();
const knex = require('../relational_db.js');

const moment = require('moment');
const Events = require('./event.js');

const signupPages = ["SignupFormPage", "FractionedSignupPage"];
const actionsFrac = ['pageView', 'endSignupStep1', 'endSignupStep2', 'signupCompletedWithDownload', 'signupCompletedWithoutDownload'];

function formsCompared() {
	return new Promise((resolve, reject) => {
		var result = {};

		Promise.all(signupPages.map(page => {
		    return knex().count('action').where({ category: page, action: 'signupCompletedWithDownload' }).from('event')
		        .then(count => {
					result[page] = count[0]["count(`action`)"];
					
		        });
			}))
			.then(_ => {
				return knex().count('action').where({ category: 'extension', action: 'install' }).from('event')
		        .then(count => { 
				    result['Install'] = count[0]["count(`action`)"];
		        });
			})
		    .then(_ => resolve(result))
		    .catch(error => reject(error));
	});
}

//TODO: transformar em promise usando Promise.all e map sobre o array de actions
function fractionedSignup() {
	return new Promise((resolve, reject) => {
		var actions ={};

		Promise.all(actionsFrac.map(action =>{
			return knex().count('action').where({category:"FractionedSignupPage", action:action}).from('event')
			.then(count => {
				actions[action] = count[0]["count(`action`)"];
			});
		}))
		.then(_=> resolve(actions))
		.catch(error =>reject(error));
	});
}

function findActiveUserEmails() {
	return new Promise((resolve, reject) => {
		knex().select('email').from('event').where({ action: 'fill' }).distinct('email')
			.then(emails => {
				return Promise.all(emails.map(email => {
					return knex().select('email').from('event').where({ email: email.email, action: 'signupCompletedWithDownload' })
						.then(event => {
							return event[0].email;
						})
						.catch(error => reject(error));
				}));
			})
			.then(activeUserEmails => {
				resolve(activeUserEmails);
			})
			.catch(error => {
				reject(error);
			});
	});
}

function getTimestamps(emails) {
	let signupDate = {};
	let fillDate = {};

	return new Promise((resolve, reject) => {
		return Promise.all(emails.map(email => {
			return knex().select('timestamp').from('event').where({ email: email, action: 'signupCompletedWithDownload' })
				.then(event => {
					signupDate[email] = event[0].timestamp;
				})
				.catch(error => reject(error));
		}))
		.then(() => {
			return Promise.all(emails.map(email => {
				return knex().from('event').where({ email: email, action: 'fill' }).min('timestamp')
					.then(event => {
						fillDate[email] = event[0].timestamp;
					})
					.catch(error => reject(error));
			}));
		})
		.then(() => {
			resolve([signupDate, fillDate]);
		})
		.catch(error => {
			reject(error);
		});
	});
}

function processDates(dates){
	return new Promise((resolve, reject) => {
		let signupDate = dates[0];
		let fillDate = dates[1];
		let dateDifferences = [];
		let emails = Object.keys(signupDate);

		for(let i = 0; i < emails.length; i++){
			dateDifferences[i] = moment(fillDate[emails[i]]).diff(signupDate[emails[i]], 'minutes');
		}

		resolve(dateDifferences);
	});
}

function fill() {
	return new Promise((resolve, reject) => {
		findActiveUserEmails()
			.then(getTimestamps)
			.then(processDates)
			.then(dateDifferences => {
				resolve(dateDifferences);
			})
			.catch(error => console.log(error));
	});
}
	
module.exports.fill = fill;
module.exports.formsCompared  = formsCompared;
module.exports.fractionedSignup = fractionedSignup;