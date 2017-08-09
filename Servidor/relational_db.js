/*
    Cria uma conexão com o banco de dados. Para alterar o SGDB do projeto, basta alterar 
    o campo client. Knex suporta MySQL, PostgreSQL, Oracle, MSSQL e Sqlite3 (local).
*/
const knex = require('knex')({
    client: 'mysql',
    connection: {
        host : '127.0.0.1',
        user : 'root',
        password : 'root',
        database : 'event_tracker_teste'
    }
});

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
function createEventTable(table){
    table.increments('id').primary();
    table.string('userId').nullable();
    table.string('eventCategory').notNull();
    table.string('eventAction').notNull();
    table.dateTime('timestamp').notNull();
}

// Cria a tabela de eventos no banco caso não exista ainda.
function connect(){
    knex.schema.createTableIfNotExists('event', createEventTable);
    return knex;
}

module.exports = connect();