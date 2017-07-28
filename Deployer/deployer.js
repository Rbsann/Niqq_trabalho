// module imports
const fs = require('fs-extra');
const pm2 = require('./pm2-promise.js');
const nginxConf = require('./nginx-conf-promise.js');
const path = require('path');
const child_process = require('child_process');

// data imports
const apiVersions = require("./api_versions.json");
const currentAPI = require("../Servidor/package.json");

// directory definition
const currentAPISourceDirectory = "../Servidor";
const homeDirectory = process.env.HOME;
const apisDirectory = path.join(homeDirectory, "NiqqAPI");

// Copy current API and install npm dependencies
var copyCurrentAPI = function() {
	return new Promise((resolve, reject) => {
		var currentAPIVersion = currentAPI.version;
		if (currentAPIVersion !== undefined) {
			// delete directory if already exists
			var currentAPIDirectory = path.join(apisDirectory, currentAPIVersion);
			console.log("Copying current API to " + currentAPIDirectory);
			fs.remove(path.join(currentAPISourceDirectory, "node_modules")) // delete node_modules directory before copying
				.catch(error => {
					console.error(error);
				})
				.then(() => fs.remove(currentAPIDirectory)) // delete destination directory if already exists
				.catch(error => {
					console.error(error);
				})
				.then(() => fs.copy(currentAPISourceDirectory, currentAPIDirectory)) // copy API directory
				.then(() => {
					console.log("Running npm install");
					child_process.execSync("cd " + currentAPIDirectory + " && npm install", {stdio:[0, 1, 2]});
				})
				.then(() => {
					resolve(true);
				})
				.catch(error => {
					reject(error); 
				});
		} else {
			reject(Error("Current API not found"));
		}
	});
};

// Start existing servers with PM2
var startServers = function(apiVersions) {
	return new Promise((resolve, reject) => {
		var environment = process.argv[2] || "prod";

		pm2.connect()
			.then(() => {
				console.log("Starting servers with PM2");
				return pm2.list();
			})
			.then(processList => Promise.all(processList.map(process => pm2.delete(process.pm_id)))) // stop and delete currently running servers
			.then(() => Promise.all(apiVersions.map(config => { // run servers listed in apiVersions
					var apiDirectory = path.join(apisDirectory, config.apiVersion);
					var scriptPath = path.join(apiDirectory, "server.js");
					var processName = "Niqq-v" + config.apiVersion;
					if (fs.existsSync(scriptPath)) {
						console.log(" - Starting " + processName);
						return pm2.start({
							name: processName,
							script: scriptPath,
							cwd: apiDirectory,
							args: [environment, config.instancePort, config.serverPath]
						});
					} else {
						console.log(" - Server " + processName + " not found");
						return true;
					}
				})))
			.then(procs => {
				pm2.disconnect();
				resolve(procs);
			})
			.catch(error => {
				pm2.disconnect();
				reject(error);
			});
	});
};

// Restart nginx
var restartNginx = function() {
	return new Promise((resolve, reject) => {
		console.log("Restarting nginx");
		child_process.execSync("sudo systemctl restart nginx", {stdio:[0, 1, 2]});
		resolve(true);
	});
};

// Write new nginx configuration
var writeNginxFile = function(apiVersions) {
	return new Promise((resolve, reject) => {
		console.log("Writing nginx configuration");
		var nginxConfigFile = path.join(apisDirectory, "nginx-niqq.conf");
		fs.mkdirp(apisDirectory) // create API directory if it doesn't exist
			.then(() => fs.writeFile(nginxConfigFile, ""))
			.catch(error => console.log(error))
			.then(() => nginxConf.create(nginxConfigFile))
			.then(nginxConfigureBasic)
			.then(conf => nginxConfigureAPIs(conf, apiVersions))
			.then(() => {
				resolve(true);
			 })
			.catch(error => {
				reject(error);
			});
	});
};

// Add default server and https redirect to nginx config
var nginxConfigureBasic = function(conf) {
	return new Promise((resolve, reject) => {
		conf.nginx._add('server'); // default server
		conf.nginx._add('server'); // HTTPS redirect server

		// default server
		conf.nginx.server[0]._add('listen', '80 default_server');
		conf.nginx.server[0]._add('listen', '[::]:80 default_server');
		conf.nginx.server[0]._add('server_name', '_');
		conf.nginx.server[0]._add('return', '403');

		// HTTPS redirect server
		conf.nginx.server[1]._add('listen', '80');
		conf.nginx.server[1]._add('listen', '[::]:80');
		conf.nginx.server[1]._add('server_name', 'api.niqq.in');
		conf.nginx.server[1]._add('return', '301 https://$host$request_uri');

		resolve(conf);
	});
};

// Add APIs to nginx config
var nginxConfigureAPIs = function(conf, apiVersions) {
	return new Promise((resolve, reject) => {
		conf.nginx._add('server');
		var apiServer = conf.nginx.server[conf.nginx.server.length - 1] || conf.nginx.server;

		// Port
		apiServer._add('listen', '443 ssl http2');
		apiServer._add('listen', '[::]:443 ssl http2');

		// Virtual host
		apiServer._add('server_name', 'api.niqq.in');

		// SSL
		apiServer._add('ssl', 'on');
		apiServer._add('ssl_certificate', '/etc/letsencrypt/live/api.niqq.in/fullchain.pem');
		apiServer._add('ssl_certificate_key', '/etc/letsencrypt/live/api.niqq.in/privkey.pem');
		apiServer._add('ssl_session_timeout', '5m');
		apiServer._add('ssl_protocols', 'TLSv1 TLSv1.1 TLSv1.2');
		apiServer._add('ssl_prefer_server_ciphers', 'on');
		apiServer._add('ssl_ciphers', '\'EECDH+AESGCM:EDH+AESGCM:AES256+EECDH:AES256+EDH\'');

		apiVersions.forEach(apiConfig => {
			apiServer._add('location', apiConfig.serverPath);
			var apiLocation = apiServer.location[apiServer.location.length - 1] || apiServer.location;
			apiLocation._add('proxy_pass', 'http://localhost:' + apiConfig.instancePort);
			apiLocation._add('proxy_http_version', '1.1');
			apiLocation._add('proxy_set_header', 'Upgrade $http_upgrade');
			apiLocation._add('proxy_set_header', 'Connection \'upgrade\'');
			apiLocation._add('proxy_set_header', 'Host $host');
			apiLocation._add('proxy_cache_bypass', '$http_upgrade');
		});

		resolve(conf);
	});
};

var checkSudo = function() {
	return new Promise((resolve, reject) => {
		if (process.getuid && process.getuid() === 0) {
			resolve(true);
		} else {
			reject("Error: deployer requires root privileges. Run with sudo.");
		}
	});
};

// Main
	checkSudo()
		.then(result => copyCurrentAPI())
		.then(result => startServers(apiVersions))
		.then(result => writeNginxFile(apiVersions))
		.then(result => restartNginx())
		.then(result => console.log("Deployment completed"))
		.catch(error => console.log(error));