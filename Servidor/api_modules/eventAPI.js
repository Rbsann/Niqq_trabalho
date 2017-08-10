const tokenAuth = require('./tokenAuth.js');
const eventRoutes = require('express').Router();
const Event = require('../models/event.js');

/*
    Autenticação nesta API é opcional!
*/

eventRoutes.post('/new', tokenAuth, (request, response) => {
    let event = request.body;
    let user = response.locals.user || null;
    
    Event.save(event, user)
         .then(() => response.status(200).end())
         .catch(error => response.status(503).end());
});

// eventRoutes.get('/all', (request, response) => {
//     Event.listAll()
//         .then((events) => {
//             response.status(200).json(events);
//         })
//         .catch((err) => { response.status(500).json(err);});
// });

module.exports = eventRoutes;