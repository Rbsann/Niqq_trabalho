const User = require('./user.js');
const knex = require('../relational_db.js')();
const tableName = 'event';

/*
    Estrutura em SQL:
    create database event_tracker_teste;
    
    use event_track_teste;

    create table event(
        id INT NOT NULL AUTO_INCREMENT,
        userId VARCHAR(40),
        eventCategory VARCHAR(40) NOT NULL,
        eventAction VARCHAR(40) NOT NULL,
        timestamp DATETIME NOT NULL,
        PRIMARY KEY(id)
    );

*/
knex.schema.createTableIfNotExists(tableName, table => {
		table.increments('id').primary();
		table.string('email', 60).nullable();
		table.string('category', 40).notNull();
		table.string('action', 40).notNull();
		table.dateTime('timestamp').notNull();
	})
	.catch(error => console.log(error));



// Lista todos os eventos salvos no banco (sem paginação)
function listAll() {
	return knex(tableName).select().table(tableName);
}




function listByEmail(email) {
	return new Promise((resolve, reject) => {
		if (!email)
			reject("INVALID_USER");

		knex(tableName)
			.where('email', email)  // retornar objeto evento
			.then((events) => resolve(events))
			.catch((error) => reject(error));
	});
}

// function count(params){
//     return new Promise((resolve, reject) => {
//         this.count(params)
//             .then(events => resolve(events))
//             .catch(error => reject(error));
//     });
// }


class Entry {
	constructor(category, action, email = null) {
		this.email = email;
		this.category = category;
		this.action = action;
		this.timestamp = new Date();
	}

	// Armazena um evento válido na base de dados.
	insert() {
		return new Promise((resolve, reject) => {
			knex(tableName)
				.insert(this)
				.then(() => resolve())
				.catch((error) => {
					reject(error);
				});
		});
	}
};

module.exports.Entry = Entry;
module.exports.listByEmail = listByEmail;
module.exports.listAll = listAll;