const database = 'event_tracker_automatico';
// const database = 'eventTracker';

// Objetos de comunicação com o database
const development = {
	host: '127.0.0.1',
	user: 'root',
	password: 'root'
};

const production = {
	host: '127.0.0.1',
	user: 'root',
	password: 'root'
};
/*
	Cria uma conexão com o banco de dados. Para alterar o SGDB do projeto, basta alterar 
	o campo client. Knex suporta MySQL, PostgreSQL, Oracle, MSSQL e Sqlite3 (local).
*/
const connectionConfig = process.argv[2] ? development : production;

/*
	Cria a estrutura no banco, caso não exista
*/
var connection = null;

module.exports = function() {
	return connection;
};

module.exports.connect = function() {
	return new Promise((resolve, reject) => {
		if (connection === null) {
			var knex = require('knex')({
				client: 'mysql',
				connection: connectionConfig
			});
			knex.raw('create database if not exists ' + database + ';')
				.then(function () {
					knex.destroy();
					connectionConfig.database = database;
					//Reinicia a conexão com database definido e cria a tabela de eventos
					connection = require('knex')({ client: 'mysql', connection: connectionConfig });
					resolve();
				})
				.catch(error => reject(error));
		} else {
			reject(Error("ALREADY_CONNECTED"));
		}
	});
	
};
