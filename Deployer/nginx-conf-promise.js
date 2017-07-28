const NginxConfFile = require('nginx-conf').NginxConfFile;

module.exports.create = function(file) {
    return new Promise((resolve, reject) => {
	    NginxConfFile.create(file, (err, conf) => {
            if (err) {
                reject(err);
            } else {
                resolve(conf);
            }
        });
    });
};