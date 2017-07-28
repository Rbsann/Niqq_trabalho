// Escolhe uri do banco de acordo com o parâmetro de execução
var env = process.argv[2] || 'prod';
switch (env) {
    case 'dev':
        var uri = 'mongodb://thiago:123456@ds149059.mlab.com:49059/niqqdb';
        break;
    case 'prod':
        var uri = 'mongodb://niqqDBProduction:(senha.DBProduction.Niqq)@127.0.0.1:27017/niqqdb';
        break;
}

// Importações necessárias
var mongoose = require('mongoose');

// Configura Promises do mongo para serem usadas como nativas
mongoose.Promise = global.Promise;

// Objeto instanciado do Banco de Dados com o Schema configurado
// module.exports.User = require('./app/models/user.js');
// module.exports.Catalog = require('./app/models/catalog.js');

// Conecta ao MongoDB
module.exports.connect = function(){
	mongoose.connect(uri, { useMongoClient: true })
		.then(() => {
			console.log("Connectado no MongoDB!");
		})
		.catch((err) => {
			console.log(err);
		});
};

// Retorna true se mongo estiver conectado
module.exports.isConnected = function() {
	var readyState = mongoose.connection.readyState;
	if (readyState === 1) {
		return true;
	}
	return false;
};