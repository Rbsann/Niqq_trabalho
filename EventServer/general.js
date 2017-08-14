const packageInfo = require('./package.json');

module.exports.isValidOrigin = function(origin) {
    var validOrigins = [];

    validOrigins.push("chrome-extension://" + module.exports.getExtensionId()); // extension origin

    if (module.exports.isProductionEnvironment()) {
        validOrigins.push("https://niqq.in"); // website origin
        validOrigins.push("https://api.niqq.in"); // api origin
    } else {
        validOrigins.push("http://localhost:8085"); // website origin
        validOrigins.push("http://localhost:8080"); // api origin
        validOrigins.push("chrome-extension://fhbjgbiflinjbdggehcddcbncdddomop");  // postman extension origin
    }

    return validOrigins.includes(origin);
};

module.exports.getPackageVersion = () => packageInfo.version;

module.exports.getEnvironment = function () {
    return process.argv[2] || "prod";
};

module.exports.getPort = function () {
    return process.argv[3] || 8080;
};
module.exports.getServerPath = function () {
    return process.argv[4] || "/";
};