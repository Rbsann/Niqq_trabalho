// NPM modules imports
const jwt = require('jsonwebtoken');

// Load package info
const packageInfo = require('./package.json');

/////////////////////////////////////////////////////////////////////////////////////////////////////////
// Execution environment checks

module.exports.getPackageVersion = () => packageInfo.version;

// Get parameters from execution arguments
module.exports.getEnvironment = function () {
    return process.argv[2] || "prod";
};
module.exports.getPort = function () {
    return process.argv[3] || 8080;
};
module.exports.getServerPath = function () {
    return process.argv[4] || "/";
};
module.exports.isProductionEnvironment = function () {
    if (module.exports.getEnvironment() === "dev")
        return false;
    return true;
};
module.exports.getServerPathSlash = function() {
    var serverPath = module.exports.getServerPath();
    if (serverPath.charAt(serverPath.length - 1) !== '/')
        serverPath += '/';
    return serverPath;
};

// Set extension IDs
const extensionIdProduction = "dblbbnhcpppahimhikokckkglicpjngo";  // chrome store
var extensionIdDevelopment = "";

if (!module.exports.isProductionEnvironment()) {
    try {
        extensionIdDevelopment = require('./devExtensionId.json');
        console.log("Development extension ID was set to " + extensionIdDevelopment);
    } catch(e) {
        console.log(e.message);
        console.log("\x1b[31mWarning: development extension ID is not defined\x1b[39m");
    }
}

module.exports.getExtensionId = function () {
    if (module.exports.isProductionEnvironment()) {
        return extensionIdProduction;
    }
    return extensionIdDevelopment;
};

module.exports.getFacebookCredentials = function () {
    var developmentCredentials = {
        clientID: "283828855394419",
        clientSecret: "a1d1700af60433956845c17b02c71d91"
    };
    var productionCredentials = {
        clientID: "1469263983148555",
        clientSecret: "55f78b61b37d09bac9fa63d5a4a6ba1e"
    };

    if (module.exports.isProductionEnvironment()) {
        return productionCredentials;
    }

    return developmentCredentials;

};

// Retorna URL do site
module.exports.getWebsiteURL = function () {
	var productionURL = "https://niqq.in/";
	var developmentURL = "http://localhost:8085/";

    if (module.exports.isProductionEnvironment()) {
        return productionURL;
    } else {
        return developmentURL;
    }
};

module.exports.isValidOrigin = function(origin) {
    var validOrigins = [];

    validOrigins.push("chrome-extension://" + module.exports.getExtensionId()); // extension origin

    if (module.exports.isProductionEnvironment()) {
        validOrigins.push("https://niqq.in"); // website origin
        validOrigins.push("https://api.niqq.in"); // api origin
    } else {
        validOrigins.push("http://localhost:8085"); // website origin
        validOrigins.push("http://localhost:8080"); // api origin
    }

    return validOrigins.includes(origin);
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////
// Recursive object manipulation

module.exports.updateObjectData = function (obj, newData) {
    for (let property in newData) { // iterate newData
        if (newData.hasOwnProperty(property)) { // ignore inherited properties
            if (obj instanceof Array && newData instanceof Array && obj[property] === undefined) {
                obj.splice(property, 0, {}); // insert empty object if not in array
            }
            if ((obj[property] === undefined || typeof newData[property] === "string") && property !== "_id") {
                obj[property] = newData[property]; // copy from newData if not in obj or is string
            } else if (typeof obj[property] === "object" && typeof newData[property] === "object") {
                module.exports.updateObjectData(obj[property], newData[property]); // update inner object
            }
        }
    }
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////
// JSON Web Token

// Segredo de encriptação do token - 128 dígitos alfanuméricos aleatórios
var tokenSecret = "qNoCjHCAldYf0K92oNQJRMTZcRdqyGJs3SwCsYBxQaqXnCzdag0f2hKOuEGx1SaHA1oF1QRYZhHEFQizlzhGi1HA3WIa41a2L7rm09td9pZG5Yv1mQfq2MmoYQzxNbt3";

module.exports.generateToken = function (payload = {}) {
    return new Promise((resolve, reject) => {
        // Cria o token usando HS256
        jwt.sign(payload, tokenSecret, { algorithm: 'HS256' }, function (error, token) {
            if (!error) {
                resolve(token);
            } else {
                reject(error);
            }
        });
    });
};

module.exports.authenticateToken = function(token) {
    return new Promise((resolve, reject) => {
        if (token !== null && token !== undefined) {
            jwt.verify(token, tokenSecret, { algorithm: 'HS256' }, function (error, payload) {
                if (!error) {
                    resolve(payload);
                } else {
                    reject(error);
                }
            });
        } else {
            reject(Error("INVALID_TOKEN"));
        }
    });
};