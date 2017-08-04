const tokenAuth = require('./tokenAuth.js');
const eventRoutes = require('express').Router();

const Event = require('../models/event.js');

// Endpoint para "eventos anônimos"
eventRoutes.post('/new', tokenAuth, (request, response) => {
    let event = new Event(request.body);
    event.store()
         .then(() => response.status(204).end())
         .catch(error => response.status(503).end());
});

// TODO: Apagar! Somente para debug!
eventRoutes.get('/event', tokenAuth, (request, response) => {
    Event.listAll()
         .then(events => response.status(200).json(events))
         .catch(response.status(503).end());
});

module.exports = eventRoutes;