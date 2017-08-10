const express = require('express');
const router = express.Router();
const knex = require('../relational_db.js');//editar nome da file
const deasync = require('deasync-promise');

const moment = require('moment');// package pra calcular a demora pra usar a extensao
const Events = require('./event.js');
const Users = require('./user.js');

function botSignUpPage() {
    var end, down, notDown;
    knex('event').where({ eventCategory: 'botSignupPage', eventAction: 'endBotConversation' }).count('eventAction').then(function (contagem1) {
        end = contagem1;
        knex('event').where({ eventCategory: 'botSignupPage', eventAction: 'signupCompletedWithDownload'}).count('eventAction').then(function (contagem2) {
            down = contagem2;
            knex('event').where({ eventCategory: 'botSignUpPage', eventAction: 'signupCompletedWithoutDownload'}).count('eventAction').then(function (contagem3) {
                notDown = contagem3;
                return [end, down, notDown];
            });
        });
    })
    .catch((error) => {
      return error;  
    });

};

function formSignUp() {
    var pView, step1, step2, down, notDown;
    knex('event').where({ eventCategory: 'formSignup', eventAction: 'pageView'}).count('eventAction').then(function (contagem4) {
        pView = contagem4;
        knex('event').where({ eventCategory: 'formSignup', eventAction: 'endSignupStep1' }).count('eventAction').then(function (contagem5) {
            step1 = contagem5;
            knex('event').where({ eventCategory: 'formSignup', eventAction: 'endSignupStep2' }).count('eventAction').then(function (contagem6) {
                step2 = contagem6;
                knex('event').where({ eventCategory: 'formSignup',  eventAction: 'signupCompletedWithDownload' }).count('eventAction').then(function (contagem7) {
                    down = contagem7;
                    knex('event').where({ eventCategory: 'formSignup', eventAction: 'signupCompletedWithoutDownload' }).count('eventAction').then(function (contagem8) {
                        notDown = contagem8;
                        return [pView, step1, step2, down, notDown];
                    });
                });
            });
        });
    });
};
function extension() {
    var downBot, downForm, install;
    knex('event').where({ eventCategory: 'formSignupPage', eventAction: 'signupCompletedWithDownload' }).count('eventAction').then(function (contagem9) {
        downBot = contagem9;
        knex('event').where({ eventCategory: 'botSignUpPage', eventAction: 'signupCompletedWithDownload' }).count('eventAction').then(function (contagem10) {
            downForm = contagem10;
            knex('event').where({ eventCategory: 'extension', eventAction: 'install' }).count('eventAction').then(function (contagem11) {
                install = contagem11;
                return [downBot, downForm, install];
            });
        });
    });
};

function getUsers(){
    return deasync(knex('event').distinct('userId').select());
}

// retorna um array de usuários que possuem eventos signupwithdownload e fill
function findValidUsers(users){
    let validUsers = [];
    let filteredUsers = [];
    
    for(let i = 0; i < users.length; i++){
        let user = deasync(knex('event').where({ userId: users[i].userId, eventAction: 'fill'}).select());
        if(user.length !== 0)
            filteredUsers.push(user[0]);
    }
    for(let i = 0; i < filteredUsers.length; i++){
        let user = deasync(knex('event').where({ userId: filteredUsers[i].userId, eventAction: 'signupCompletedWithDownload'}).select());
        if(user.length !== 0)
            validUsers.push(user[0]);
    }

    return validUsers;
}

function getTimestamps(validUsers){
    let dataTot = [], dataFill = [], dataSignup = [];

    for(let i = 0; i < validUsers.length; i++){
        let datefill = deasync(knex('event').where({ userId: validUsers[i].userId, eventAction: 'fill' }).min('timestamp'));
        dataFill.push((datefill[0])['min(`timestamp`)']);

        let dateSignup = deasync(knex('event').where({ userId: validUsers[i].userId, eventAction: 'signupCompletedWithDownload' }).select('timestamp'));
        dataSignup.push((dateSignup[0].timestamp));

        dataTot[i] = moment(dataFill[i]).diff(dataSignup[i], 'minutes');
    }

    return dataTot;
}
function fill(){
    let users = getUsers();
    let validUsers = findValidUsers(users);
    let timestamps = getTimestamps(validUsers);
}

module.exports.botSignUpPage = botSignUpPage;
module.exports.fill = fill;
module.exports.extension = extension;
module.exports.formSignUp = formSignUp;