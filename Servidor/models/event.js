const User = require('./user.js');
const knex = require('../relational_db.js');
const tableName = 'event';


// Lista todos os eventos salvos no banco (sem paginação)
function listAll(){
    return knex(tableName).select().table(tableName);
}

/* 
Armazena um evento válido na base de dados. Um evento é válido deve ter 
os atributos eventCategory,eventAction e timestamp. O atributo userId é opcional.
*/
function save(event, user){
    return new Promise((resolve, reject) => {

        event.timeStamp = new Date();
        knex(tableName)
            .insert(event)
            .then(() => resolve())
            .catch((error) => {
                console.log(error);
                reject(error);
            });
    });
}

function listByUserId(userId){
    return new Promise((resolve, reject) => {
        if(!userId)
            reject("INVALID_USER");

        knex(tableName)
            .where('email', email)  // retornar objeto evento
            .then((events) => resolve(events))
            .catch((error) => reject(error));
    });
}

function count(params){
    return new Promise((resolve, reject) => {
        this.count(params)
            .then(events => resolve(events))
            .catch(error => reject(error));
    });
}

module.exports.listAll = listAll;
module.exports.save = save;
module.exports.listByUserId = listByUserId;
module.exports.count = count;
