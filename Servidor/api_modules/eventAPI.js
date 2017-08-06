const tokenAuth = require('./tokenAuth.js');
const eventRoutes = require('express').Router();
const Event = require('../models/event.js');

/*
    Autenticação nesta API é opcional!
*/

// Quando a api receber uma requisição de verbo POST, 
eventRoutes.post('/new', tokenAuth, (request, response) => {
    //Monta um objeto evento com os dados enviados pela extensão
    let event = new Event(request.body);
    // Se tiver, pega o usuário autenticado da requisição para associar ao evento
    let user = response.locals.user || null;

    // Salva o evento na base de dados e 
    event.store(user)
         .then(() => response.status(200).end())
         .catch(error => response.status(503).end());
});

module.exports = eventRoutes;