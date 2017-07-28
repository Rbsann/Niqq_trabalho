const pm2 = require('pm2');

module.exports.connect = function() {
    return new Promise((resolve, reject) => {
		pm2.connect(err => {
			if (err) {
				reject(err);
			} else {
				resolve(true);
			}
		});
	});
};

module.exports.disconnect = function() {
    return new Promise((resolve, reject) => {
		pm2.disconnect();
        resolve(true);
	});
};

module.exports.list = function() {
	return new Promise((resolve, reject) => {
		pm2.list((err, processList) => {
			if (err) {
				reject(err);
			} else {
				resolve(processList);
			}
		});
	});
};

module.exports.start = function(options) {
    return new Promise((resolve, reject) => {
        pm2.start(options, (err, proc) => {
            if (err) {
                reject(err);
            } else {
                resolve(proc);
            }
        });
    });
};

module.exports.delete = function(process) {
	return new Promise((resolve, reject) => {
		pm2.delete(process, err => {
			if (err) {
				reject(err);
			} else {
				resolve(true);
			}
		});
	});
};