const RateLimit = require('express-rate-limit');

// require Catalog object
var Catalog = require('../models/catalog.js');
const catalogRoutes = require('express').Router();

const tokenAuth = require('./tokenAuth.js');

var catalogAPILimiter = new RateLimit({
	windowMs: 5 * 60 * 1000, // 5 minute window
	max: 200, // requests per windowMs
	delayAfter: 180,
	delayMs: 1000
});

catalogRoutes.use(catalogAPILimiter);

// Get entry command
// - Authorization required: email, token
// - Request data: url
// - Response data: fields
//  fields = [{
// 		fieldTag: "",
//  	fieldType: "",
// 		name: "",
// 		id: "",
// 		placeholder: "",
// 		mappingIdentifier: "",
// 		mappingSubIdentifier: "",
// 		mappingIndex: -1,
// 		options: [{text: "", value: "", mappingIdentifier: ""}]
// }]
catalogRoutes.post("/getEntry", tokenAuth, (request, response) => {
	var payload = request.body;
	if (payload.url === undefined || payload.url === null) {
		response.sendError("Malformed request");
	} else {
		var url = payload.url;
		Catalog.findEntryByURL(url)
			.then(catalogEntry => catalogEntry.getBestFieldMappings())
			.then(bestFieldMappings => {
				response.sendResult({fields: bestFieldMappings});
			})
			.catch((error) => {
				if (error.message === "URL_NOT_FOUND") {
					response.sendError("ENTRY_NOT_FOUND");
				} else {
					console.log(error);
					response.sendError("SERVER_ERROR");
				}
			});
	}
});

// Update entry command
// - Authorization required: email, token
// - Request data: url, fields 
//  fields = [{
// 		fieldTag: "",
//  	fieldType: "",
// 		name: "",
// 		id: "",
// 		placeholder: "",
// 		mappingIdentifier: "",
// 		mappingSubIdentifier: "",
// 		mappingIndex: -1,
// 		options: [{text: "", value: "", mappingIdentifier: ""}]
// }]
// - Response data: updatedEntry 
catalogRoutes.post("/updateEntry", tokenAuth, (request, response) => {
	var user = response.locals.user;
	var catalogger = (user.role === "catalogger");
	var payload = request.body;
	if (payload.url === undefined || payload.url === null) {
		response.sendError("INCOMPLETE_REQUEST");
	} else if (payload.fields === undefined || payload.fields === null) {
		response.sendError("INCOMPLETE_REQUEST");
	} else {
		var url = payload.url;
		var fields = payload.fields;
		Catalog.findEntryByURL(url)
			.then(catalogEntry => updateMappings(catalogEntry, fields, catalogger))
			.then(result => {
				response.sendResult({ updatedEntry: result });
			})
			.catch(error => {
				if (error.message === "URL_NOT_FOUND") { // create new entry if not found
					Catalog.createEntry(url)
						.then(newCatalogEntry => updateMappings(newCatalogEntry, fields, catalogger))
						.then(result => {
							response.sendResult({ updatedEntry: result });
						})
						.catch(error => {
							console.log(error);
							response.sendError("SERVER_ERROR");
						});
				} else if (error.message === "INVALID_IDENTIFIER") {
					response.sendError("INVALID_IDENTIFIER");
				} else {
					console.log(error);
					response.sendError("SERVER_ERROR");
				}
			});
	}
});

// Update field mappings given a catalog entry
// Resolve: true
// Reject: unexpected error
/*jshint loopfunc:true */ // allow functions within loops
var updateMappings = function (catalogEntry, fields, catalogger = false) {
	return new Promise((resolve, reject) => {
		Promise.all(fields.map(reqField =>
			catalogEntry.getOrAddField(reqField.fieldTag, reqField.fieldType, reqField.name, reqField.id, reqField.placeholder)
				.then(field => field.updateMapping(reqField.mappingIdentifier, reqField.mappingSubIdentifier, reqField.mappingIndex, catalogger))
				.then(field => Promise.all(reqField.options.map(reqOption =>
					field.getOrAddOption(reqOption.text, reqOption.value)
						.then(option => option.updateMapping(reqOption.mappingIdentifier, reqField.mappingIdentifier, reqField.mappingSubIdentifier, catalogger))
				)))
				.catch(error => { throw error; })
		))
			.then(() => catalogEntry.save())
			.then(() => {
				resolve(true);
			})
			.catch(error => {
				reject(error);
			});
	});
};

module.exports = catalogRoutes;