const tokenAuth = require('./tokenAuth.js');
const eventRoutes = require('express').Router();
const Event = require('../models/event.js');

/*
    Autenticação nesta API é opcional!
*/

eventRoutes.post('/new', tokenAuth, (request, response) => {
    let event = new Event(request.body);
    event.store()
         .then(() => response.status(204).end())
         .catch(error => response.status(503).end());
});

module.exports = eventRoutes;