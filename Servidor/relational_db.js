// Objetos de comunicação com o database
const development = {
    host: '127.0.0.1',
    user: 'root',
    password: 'root',
};

const production = {
    host: '',
    user: '',
    password: '',
};

/*
    Cria uma conexão com o banco de dados. Para alterar o SGDB do projeto, basta alterar 
    o campo client. Knex suporta MySQL, PostgreSQL, Oracle, MSSQL e Sqlite3 (local).
*/
const connectionConfig = process.argv[2] ? development : production;

var knex = require('knex')({
    client: 'mysql',
    connection: connectionConfig
});

/*
    Cria a estrutura no banco, caso não exista
*/
const databaseName = 'event_tracker_automatico';

function generateDataStructure(){
    knex.raw('create database if not exists ' + databaseName + ';')
        .then(function(){
            knex.destroy();
            connectionConfig.database = databaseName;

            //Reinicia a conexão com database definido e cria a tabela de eventos
            knex = require('knex')({ client: 'mysql', connection : connectionConfig });
            knex.schema.createTableIfNotExists('event', createEventTable)
                .then(() => console.log('Banco relacional verificado.'));
        })
        .catch((error) => {
            console.log(error);
        });
}
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
    table.string('userId', 40).nullable();
    table.string('eventCategory', 40).notNull();
    table.string('eventAction', 40).notNull();
    table.dateTime('timestamp').notNull();
}

// Cria a tabela de eventos no banco caso não exista ainda.
function connect(){
    // generateDataStructure();
    // return knex;
    connectionConfig.database = databaseName;
    //TODO: refatorar
    return require('knex')({ client: 'mysql', connection : connectionConfig });
}

module.exports = connect();