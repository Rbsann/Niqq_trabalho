const eventRoutes = require('express').Router();
const EventManager = require('../models/event.js');
const General = require('../general.js');


/*
    Autenticação nesta API é opcional!
*/

eventRoutes.post('/new', getEmailFromToken, (request, response) => {
    let payload = request.body;
    if (payload.category === undefined || payload.action === undefined){
        response.status(400).send("malformed request");
        return;
    }

    let event = new EventManager.Entry(payload.category, payload.action, response.locals.email);
    
    event.insert()
        .then(() => response.status(200).send("event saved"))
        .catch(error => {
            console.log(error);
            response.status(503).send("error");
        });
});

eventRoutes.get('/all', (request, response) => {
    // response.send("all events");
    EventManager.listAll()
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