// Objetos de comunicação com o database
const development = {
    database: 'eventTracker',
    host: '127.0.0.1',
    user: 'root',
    password: 'root',
};

const production = {
    database: 'eventTracker',
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
function generateDataStructure(){
    knex.raw('create database if not exists ' + connectionConfig.database + ';')
        .then(function(){
            knex.destroy();

            //Reinicia a conexão com database definido e cria a tabela de eventos
            knex = require('knex')({ client: 'mysql', connection : connectionConfig });
            
        })
        .catch((error) => {
            console.log(error);
        });
}
    
// Cria a tabela de eventos no banco caso não exista ainda.
function connect(){
    // generateDataStructure();
    // return knex;

    //TODO: refatorar
    return require('knex')({ client: 'mysql', connection : connectionConfig });
}

module.exports = function() {
    generateDataStructure();
    return connect();
}();