var mongoose = require('mongoose');
var Schema = mongoose.Schema;

mongoose.Promise = global.Promise;

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/// Identifier/sub-identifier validation
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// check if field mapping identifier is valid
var isValidMappingIdentifier = function (identifier, subIdentifier = null) {
	return new Promise((resolve, reject) => {
		for (let mappingIterator = 0; mappingIterator < mappingIdentifiers.length; mappingIterator++) {
			if (mappingIdentifiers[mappingIterator] === identifier) {
				var subIdentifiers = mappingSubIdentifiers[identifier];
				// find subidentifier if set and subidentifiers exist
				if (subIdentifier !== null && subIdentifiers !== undefined) {
					for (let subIterator = 0; subIterator < subIdentifiers.length; subIterator++) {
						// identifer matches and subidentifier matches
						if (subIdentifiers[subIterator] === subIdentifier) {
							resolve(true);
							return;
						}
					}
					// subidentifier set but no subidentifiers
				} else if (subIdentifier !== null && subIdentifiers === undefined) {
					reject(Error("INVALID_IDENTIFIER"));
					return;
					// subidentifier not set but subidentifiers exist
				} else if (subIdentifier === null && subIdentifiers !== undefined) {
					reject(Error("INVALID_IDENTIFIER"));
					return;
					// no subidentifier set and no subidentifiers, but identifier matches
				} else {
					resolve(true);
					return;
				}
			}
		}
		reject(Error("INVALID_IDENTIFIER"));
	});
};

var mappingIdentifiers = [
	"email",
	"name",
	"CPF",
	"RG",
	"cellphone",
	"phone",
	"DOB",
	"gender",
	"address",
	"CPF_space",
	"password",
	"unknown"
];

var mappingSubIdentifiers = {
	"name": [
		"first",
		"last",
		"full"
	],
	"address": [
        "ZIP",
        "number",
		"complement",
		"street",
		"city",
		"neighborhood",
        "state",
        "type",
		"reference",
        "country",
        "ZIP_part1",
        "ZIP_part2",
        "ZIP_space"
	],
	"cellphone": [
		"country",
		"area",
		"number",
		"domestic",
		"full"
	],
	"phone": [
		"country",
		"area",
		"number",
		"domestic",
		"full"
	],
	"DOB": [
		"day",
		"month",
		"year",
		"dmySlash",
		"dmyDash",
		"mdySlash",
		"mdyDash",
		"ymdSlash",
		"ymdDash"
	]
};


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/// Option Schema
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var optionSchema = new Schema({
	text: { type: String, maxlength: 100 },
	value: { type: String, maxlength: 100 },
	id: { type: String, maxlength: 100 },
	mappings: [{
		identifier: { type: String, maxlength: 100 }, // male, female...
		fieldIdentifier: { type: String, maxlength: 100 }, // email, nameFirst...
		fieldSubIdentifier: { type: String, maxlength: 100 },  // street, prefix
		votes: { type: Number },
		certainty: { type: Number }
	}]
});


// Update or add new mapping in option
// Resolve: true
// Reject: unexpected error
optionSchema.methods.updateMapping = function(identifier, fieldIdentifier, fieldSubIdentifier, catalogger = false) {
	return new Promise((resolve, reject) => {
		fieldSubIdentifier = fieldSubIdentifier || null; // set as null if undefined

		for (var i = 0; i < this.mappings.length; i++) {
			var mapping = this.mappings[i];
			if (mapping.identifier === identifier && mapping.fieldIdentifier === fieldIdentifier && mapping.fieldSubIdentifier === fieldSubIdentifier) {
				mapping.votes = catalogger ? 500 : mapping.votes + 1;
				resolve(true);
				return;
			}
		}

		// add mapping if not found
		var newMapping = {
			identifier: identifier,
			fieldIdentifier: fieldIdentifier,
			fieldSubIdentifier: fieldSubIdentifier,
			votes: catalogger ? 500 : 1
		};
		this.mappings.push(newMapping);
		resolve(true);
	});
};


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/// Field Schema
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var fieldSchema = new Schema({
	identification: {
		fieldTag: { type: String, maxlength: 100 }, // input, select
		fieldType: { type: String, maxlength: 100 }, // text, password, radio, checkbox, date, email, tel...
		name: { type: String, maxlength: 100 },
		id: { type: String, maxlength: 100 },
		placeholder: { type: String, maxlength: 100 }
	},
	mappings: [{
		identifier: { type: String, maxlength: 100 }, // email, nameFirst...
		subIdentifier: { type: String, maxlength: 100 },  // street, prefix
		index: { type: Number }, // for repeating identifier (e.g. 2 emails or 2 phones)
		votes: { type: Number }, // amount of times this mapping was chosen
		certainty: { type: Number }
	}],
	options: [optionSchema]
});

// Update field mapping
// Resolve: field
// Reject: unexpected error
fieldSchema.methods.updateMapping = function (mappingIdentifier, mappingSubIdentifier = null, mappingIndex = 0, catalogger = false) {
	return new Promise((resolve, reject) => {
		mappingSubIdentifier = mappingSubIdentifier || null; // set as null if undefined

		isValidMappingIdentifier(mappingIdentifier, mappingSubIdentifier)
			.then(result => {
				for (var i = 0; i < this.mappings.length; i++) {
					var mapping = this.mappings[i];
					if (mapping.identifier === mappingIdentifier && mapping.subIdentifier === mappingSubIdentifier && mapping.index === mappingIndex) {
						mapping.votes = catalogger ? 500 : mapping.votes + 1;
						mappingUpdated = true;
						resolve(this);
						return;
					}
				}
				throw Error("MAPPING_NOT_FOUND");
			})
			.catch(error => {
				if (error.message === "MAPPING_NOT_FOUND") { // add new mapping if not found
					var newMapping = {
						identifier: mappingIdentifier,
						subIdentifier: mappingSubIdentifier,
						index: mappingIndex,
						votes: catalogger ? 500 : 1
					};
					this.mappings.push(newMapping);
					resolve(this);
				} else {
					reject(error);
				}
			});
	});
};

// Get option from field
// Resolve: option
// Reject: OPTION_NOT_FOUND or unexpected error
fieldSchema.methods.getOption = function (text, value, id = null) {
	return new Promise((resolve, reject) => {
		for (let optionIterator = 0; optionIterator < this.options.length; optionIterator++) {
			let option = this.options[optionIterator];
			if (option.text === text && option.value === value && option.id === id) {
				resolve(option);
				return;
			}
		}
		reject(Error("OPTION_NOT_FOUND"));
	});
};

// Get or add an option to field
// Resolve: option
// Reject: unexpected error
fieldSchema.methods.getOrAddOption = function (text, value, id = null) {
	return new Promise((resolve, reject) => {
		this.getOption(text, value, id)
			.then(option => resolve(option))
			.catch(error => {
				if (error.message === "OPTION_NOT_FOUND") {
					var newOption = {
						text: text,
						value: value,
						id: id,
						mappings: []
					};
					this.options.push(newOption);
					resolve(this.getOption(text, value, id));
				} else {
					reject(error);
				}
			});
	});
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/// Catalog Schema
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var catalogSchema = new Schema({
	url: { type: String, required: true, unique: true, maxlength: 200 },
	voters: { type: [String] }, // array of ids
	fields: [fieldSchema],
	validated: {type: Boolean, default: false} // if false, entry is pending manual validation
}, { collection: "catalog" }); // set collection name

// Get field by identification object in catalog entry
// Resolve: field
// Reject: FIELD_NOT_FOUND or unexpected error
catalogSchema.methods.getField = function (identification) {
	return new Promise((resolve, reject) => {
		for (let fieldIterator = 0; fieldIterator < this.fields.length; fieldIterator++) {
			let field = this.fields[fieldIterator];
			let fieldIdent = field.identification;

			if (fieldIdent.fieldTag === identification.fieldTag &&
				fieldIdent.fieldType === identification.fieldType &&
				fieldIdent.name === identification.name &&
				fieldIdent.id === identification.id &&
				fieldIdent.placeholder === identification.placeholder) {
				resolve(field);
				return;
			}
		}

		reject(Error("FIELD_NOT_FOUND"));
	});
};

// Get or add field in catalog entry
// Resolve: field
// Reject: unexpected error
catalogSchema.methods.getOrAddField = function (fieldTag, fieldType, name, id, placeholder) {
	return new Promise((resolve, reject) => {
		var identification = {
			fieldTag: fieldTag || null,
			fieldType: fieldType || null,
			name: name || null,
			id: id || null,
			placeholder: placeholder || null
		};
		this.getField(identification) // find existing field
			.then(field => resolve(field))
			.catch(error => {
				if (error.message === "FIELD_NOT_FOUND") { // add new field if not found
					var newField = {
						identification: identification,
						mappings: [],
						options: []
					};
					this.fields.push(newField);
					resolve(this.getField(identification));
				} else {
					reject(error);
				}
			});
	});
};


// Get array of fields and most likely mappings for catalog entry
// Resolve: best mappings
// Reject: unexpected error
catalogSchema.methods.getBestFieldMappings = function () {
	return new Promise((resolve, reject) => {
		resolve(this.fields.map(function (field) {
			// find best mapping for field
			var bestMapping = { votes: -1 };
			field.mappings.forEach(function (currentMapping) {
				if (currentMapping.votes > bestMapping.votes)
					bestMapping = currentMapping;
			});

			// format field with its best mapping
			return {
				fieldTag: field.identification.fieldTag,
				fieldType: field.identification.fieldType,
				name: field.identification.name,
				id: field.identification.id,
				placeholder: field.identification.placeholder,
				mappingIdentifier: bestMapping.identifier,
				mappingSubIdentifier: bestMapping.subIdentifier,
				mappingIndex: bestMapping.index,
				options: field.options.map(function (option) {
					// find best mapping for option
					var bestOptionMapping = { votes: -1 };
					option.mappings.forEach(function (currentOptionMapping) {
						// find best option mapping which corresponds to the best field mapping found previously
						if (currentOptionMapping.fieldIdentifier === bestMapping.identifier && currentOptionMapping.fieldSubIdentifier === bestMapping.subIdentifier && currentOptionMapping.votes > bestOptionMapping.votes) {
							bestOptionMapping = currentOptionMapping;
						}
					});

					// format and push option with its best mapping
					var processedOption = {
						text: option.text,
						value: option.value,
						id: option.id,
						mappingIdentifier: bestOptionMapping.identifier
					};

					return processedOption;
				})
			};
		}));
	});
	
};

catalogSchema.methods.setValidated = function(validated) {
	return new Promise((resolve, reject) => {
		this.validated = validated;
		this.save()
			.then(_ => resolve(true))
			.catch(error => reject(error));
	});
};

// Export catalog model
module.exports = mongoose.model('Catalog', catalogSchema);

// Get catalog entry by URL
// Resolve: catalogEntry
// Reject: URL_NOT_FOUND or unexpected error
module.exports.findEntryByURL = function (url) {
	return new Promise((resolve, reject) => {
		var params = {
			url: url
		};
		this.findOne(params)
			.then((catalogEntry) => {
				if (catalogEntry === null) {
					reject(Error("URL_NOT_FOUND"));
				} else {
					resolve(catalogEntry);
				}
			})
			.catch((error) => {
				reject(error);
			});
	});
};

// Create new catalog entry
// Resolve: newCatalogEntry
// Reject: URL_ALREADY_EXISTS or unexpected error
module.exports.createEntry = function (url) {
	return new Promise((resolve, reject) => {
		// search for existing URL
		module.exports.findEntryByURL(url)
			.then((catalogEntry) => {
				// reject if URL data has already been created
				reject(Error("URL_ALREADY_EXISTS"));
			})
			.catch((error) => {
				// create new URL data if not already in db
				if (error.message === "URL_NOT_FOUND") {
					var newCatalogEntry = new this();
					newCatalogEntry.url = url;
					newCatalogEntry.save()
						.then(() => {
							resolve(newCatalogEntry);
						})
						.catch((error) => {
							reject(error);
						});
				} else {
					reject(error);
				}

			});
	});
};

// Find entries pending validation
// Resolve: array of entries
// Reject: unexpected error
module.exports.findUnvalidatedEntries = function () {
	return new Promise((resolve, reject) => {
		this.find({validated: false})
			.then(entries => resolve(entries))
			.catch(error => reject(error));
	});
};

// Find all entries
// Resolve: array of entries
// Reject: unexpected error
module.exports.findAllEntries = function () {
	return new Promise((resolve, reject) => {
		this.find().sort({validated: 'asc'})
			.then(entries => resolve(entries))
			.catch(error => reject(error));
	});
};