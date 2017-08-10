const eventRoutes = require('express').Router();
const Event = require('../models/event.js');
const General = require('../general.js');


/*
    Autenticação nesta API é opcional!
*/

eventRoutes.post('/new', getEmailFromToken, (request, response) => {
    let event = request.body;
    event.email = response.locals.email;
    delete event.token;
    
    Event.save(event)
         .then(() => response.status(200).send("event saved"))
         .catch(error => response.status(503).send("error"));
});

eventRoutes.get('/all', (request, response) => {
    // response.send("all events");
    Event.listAll()
        .then((events) => {
            response.status(200).json(events);
        })
        .catch((err) => { response.status(500).json(err);});
});


function getEmailFromToken (request, response, next) {
    var token = request.body.token;
    response.locals.email = null;

	General.authenticateToken(token)
		.then(payload => {
            response.locals.email = payload.email;
            next();
        })
        .catch(error => {
            next();
        });
}


module.exports = eventRoutes;