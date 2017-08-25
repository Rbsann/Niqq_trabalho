// Imports
var Fuse = require("fuse.js");
const cheerio = require('cheerio');
var $;

module.exports.loadHTML = function(html) {
	$ = cheerio.load(html);
};

// Return array of page inputs
module.exports.getInputs = function() {
	var inputs = [];
	$("input").each(
		function (index) {
			// get jQuery element
			var input = $(this);

			// get labels
			var labels = [];
			var labelParents = input.parents('label');
			for (i = 0; i < labelParents.length; i++)
				labels.push(labelParents[i].innerText);
			var labelFors = $("label[for='" + input.attr('id') + "']");
			for (i = 0; i < labelFors.length; i++)
				labels.push(labelFors[i].innerText);

			var input_data = {
				'name': input.attr('name') || null,    // para consistencia com o catálogo
				'type': input.attr('type') || null,
				'id': input.attr('id') || null,
				'placeholder': input.attr('placeholder') || null,
				'title': input.attr('title') || null,
				'value': input.val(),
				'labels': labels,
				// 'jQElement': input,
				// 'domElement': input.get(0), // raw DOM element
				'filled': false
			};

			inputs.push(input_data);
			

		}
	);
	
	return inputs;
};

// Return array of page selects
module.exports.getSelects = function () {
	var selects = [];
	$("select").each(function () {
		// get jQuery element
		var select = $(this);

		// get labels
		var labels = [];
		var labelParents = select.parents('label');
		for (i = 0; i < labelParents.length; i++)
			labels.push(labelParents[i].innerText);
		var labelFors = $("label[for='" + select.attr('id') + "']");
		for (i = 0; i < labelFors.length; i++)
			labels.push(labelFors[i].innerText);

		var selectData = {
			'name': select.attr('name') || null,
			'id': select.attr('id') || null,
			'title': select.attr('title') || null,
			'value': select.val(),
			'labels': labels,
			// 'jQElement': select,
			// 'domElement': select.get(0), // raw DOM element
			'options': [],
			'filled': false
		};

		var numOptions = 0;
		
		select.children("option").each(function () {
			var option = $(this);

			var optionData = {
				'value': option.attr('value') || null,
				'text': option.text() || null,
				// 'jQElement': option
			};

			selectData.options.push(optionData);

			if (numOptions++ > 1000)
				return false;
		});

		if (numOptions < 1000)
			selects.push(selectData);
		
	});
	return selects;
};

// Process form command
// - Request data: inputs, selects
// - Response data: mappedFields
module.exports.processForm = function(inputs, selects) {
  return new Promise((resolve, reject) => {
    processFormPromise([inputs, selects])
      .then(mappedFields => {
        resolve({ mappedFields: mappedFields });
      })
      .catch(error => {
        console.log(error);
        reject("SERVER_ERROR");
      });
  });
};

// Get form score command
// - Request data: inputs, selects
// - Response data: formScore
module.exports.getFormScore = function() {
  return new Promise((resolve, reject) => {
		var inputs = module.exports.getInputs();
		var selects = module.exports.getSelects();

    processFormPromise([inputs, selects])
      .then(calculateFormScorePromise)
      .then(formScore => {
        resolve({ formScore: formScore });
      })
      .catch(error => {
        console.log(error);
        reject("SERVER_ERROR");
      });
  });
};


// Score calculation promise
var calculateFormScorePromise = function (mappedFields) {
	return new Promise((resolve, reject) => {
		// console.log(mappedFields);
		var scoreByIdentifier = [
			{ identifier: "name", subIdentifier: "first", score: 2 },
			{ identifier: "name", subIdentifier: "last", score: 2 },
			{ identifier: "name", subIdentifier: "full", score: 3 },
			{ identifier: "email", score: 2 },
			{ identifier: "DOB", subIdentifier: "day", score: 2 },
			{ identifier: "DOB", subIdentifier: "month", score: 2 },
			{ identifier: "DOB", subIdentifier: "year", score: 2 },
			{ identifier: "DOB", subIdentifier: "dmySlash", score: 6 },
			{ identifier: "DOB", subIdentifier: "ymdDash", score: 6 },
			{ identifier: "CPF", score: 8 },
			{ identifier: "RG", score: 4 },
			{ identifier: "cellphone", subIdentifier: "area", score: 2 },
			{ identifier: "cellphone", subIdentifier: "number", score: 2 },
			{ identifier: "cellphone", subIdentifier: "domestic", score: 4 },
			{ identifier: "gender", score: 8 },
			{ identifier: "address", subIdentifier: "ZIP", score: 8 },
			{ identifier: "address", subIdentifier: "number", score: 2 },
			{ identifier: "address", subIdentifier: "complement", score: 2 },
			{ identifier: "address", subIdentifier: "reference", score: 2 },
		];

		var formScore = 0;

		mappedFields.forEach((mappedField) => {
			scoreByIdentifier.forEach((score) => {
				if (mappedField.mappingIdentifier === score.identifier && mappedField.mappingSubIdentifier === score.subIdentifier) {
					formScore += score.score;
				}
			});
		});

		resolve(formScore);
	});
};


// Form processing promise
var processFormPromise = function ([inputs, selects]) {
	return new Promise((resolve, reject) => {
		var formProcessor = new FormProcessor(inputs, selects);
		// console.log("Form processing started");
		formProcessor.processPromise()
			.then(mappedFields => {
				//console.log(processedFields);
				resolve(mappedFields);
			})
			.catch(error => {
				reject(error);
			});
	});
};


// Form processing class
function FormProcessor(inputs, selects) {
	var processedFields = [];
	this.inputs = inputs;
	this.selects = selects;


	// Mapeia campos de texto
	function mapTextInput(searchResult, identifier, subIdentifier = undefined, numberOfInputs = 1) {
		var numberFilled = 0;
		// console.log("search result: ", searchResult);
		for (var i = 0; numberFilled < numberOfInputs && i < searchResult.length; i++) {
			if (searchResult[i].type !== "radio") {
				//console.log(searchResult[i]);
				searchResult[i].filledValue = identifier;
				numberFilled++;

				var processedField = {
					fieldTag: "input",
					fieldType: searchResult[i].type,  // caso indefinido, deixa indefinido para identificação ficar consistente
					name: searchResult[i].name,
					id: searchResult[i].id,
					placeholder: searchResult[i].placeholder,
					mappingIdentifier: identifier,
					mappingSubIdentifier: subIdentifier,
					mappingIndex: 0
				};
				
				processedFields.push(processedField);
			}
		}
	}

	// Mapeia botões radio de gênero
	function mapGenderRadio(maleResult, femaleResult) {
		
		var field = {
			fieldTag: "input",
			fieldType: "radio",
			name: maleResult.name,
			mappingIdentifier: "gender",
			mappingIndex: 0,
			options: [{
				id: maleResult.id,
				value: maleResult.value,
				mappingSubIdentifier: "male"
			},
			{
				id: femaleResult.id,
				value: femaleResult.value,
				mappingSubIdentifier: "female"
			}]
		};
		
		//console.log(field);
		processedFields.push(field);
	}


	function mapGenderSelect(searchResult) {
		searchResult.filledValue = "gender";
		
		var field = {
			fieldTag: "select",
			name: searchResult.name,
			id: searchResult.id,
			mappingIdentifier: "gender",
			mappingIndex: 0,
			options: []
		};

		Promise.all([
			searchOptions(searchResult.options, ["male", "masculino"]),
			searchOptions(searchResult.options, ["female", "feminino"])
			])
			.then(([maleResult, femaleResult]) => {
				// console.log(femaleResult);

				if (maleResult && femaleResult){
					field.options = [{
						text: maleResult.text,
						value: maleResult.value,
						mappingSubIdentifier: "male"
					},
					{
						text: femaleResult.text,
						value: femaleResult.value,
						mappingSubIdentifier: "female"
					}];
		
					//console.log(field);
					processedFields.push(field);
				}
			})
			.catch((error) => {
				console.log(error);
			});
	}


	// Name mapping promise
	this.mapNamePromise = function () {
		return new Promise((resolve, reject) => {

			Promise.all([
					searchFields(inputs, ["first", "primeiro", "nome"]),
					searchFields(inputs, ["last", "ultimo", "sobrenome"])
				])
				.then(([firstNameResult, lastNameResult]) => {
					if (firstNameResult.length > 0 && lastNameResult.length > 0) {
						//console.log("Found separate first and last name");
						mapTextInput(firstNameResult, "name", "first");
						mapTextInput(lastNameResult, "name", "last");
						resolve("FOUND_NAME_SEPARATE");
					} else {
						searchFields(inputs, ["name", "completo", "nome"])
							.then((fullNameResult) => {
								if (fullNameResult.length > 0) {
									//console.log("Found full name");
									mapTextInput(fullNameResult, "name", "full");
									resolve("FOUND_NAME_FULL");
								} else {
									resolve("NOT_FOUND_NAME");
								}
							});
					}
				})
				.catch((error) => {
					reject(error);
				});
		});
	};

	// Email filling promise
	this.mapEmailPromise = function () {
		return new Promise((resolve, reject) => {
			searchFields(inputs, ["email", "e-mail"])
				.then((emailResult) => {
					if (emailResult.length > 0 && emailResult[0]) {
						// console.log("Found email");
						mapTextInput(emailResult, "email", undefined, 3);
						resolve("FOUND_EMAIL");
					} else {
						// console.log("Not found email");
						resolve("NOT_FOUND_EMAIL");
					}
				})
				.catch((error) => {
					reject(error);
				});
		});
	};

	// Date of birth filling promise
	this.mapDOBPromise = function () {
		return new Promise((resolve, reject) => {

			Promise.all([
					searchFields(inputs, ["dia", "day"]),
					searchFields(inputs, ["mes", "month"]),
					searchFields(inputs, ["ano", "year"])
				])
				.then(([dayResult, monthResult, yearResult]) => {
					if (dayResult.length > 0 && monthResult.length > 0 && yearResult.length > 0) {
						//console.log("Found separate DOB");
						mapTextInput(dayResult, "DOB", "day");
						mapTextInput(monthResult, "DOB", "month");
						mapTextInput(yearResult, "DOB", "year");
						resolve("FOUND_DOB_SEPARATE");
					} else {
						searchFields(inputs, ["birth", "nasc"])
							.then((dobResult) => {
								if (dobResult.length > 0) {
									//console.log("Found DOB");
									if (dobResult[0].type === "date") {
										mapTextInput(dobResult, "DOB", "ymdDash");
									} else {
										mapTextInput(dobResult, "DOB", "dmySlash");
									}
									resolve("FOUND_DOB_FULL");
								} else {
									resolve("NOT_FOUND_DOB");
								}
							});
					}
				})
				.catch((error) => {
					reject(error);
				});
		});
	};

	// CPF filling promise
	this.mapCPFPromise = function () {
		return new Promise((resolve, reject) => {
			searchFields(inputs, ["cpf"])
				.then((cpfResult) => {
					if (cpfResult.length > 0) {
						//console.log("Found CPF");
						//console.log(cpfResult);
						mapTextInput(cpfResult, "CPF");
						resolve("FOUND_CPF");
					} else {
						resolve("NOT_FOUND_CPF");
					}
				})
				.catch((error) => {
					reject(error);
				});
		});
	};

	this.mapRGPromise = function () {
		return new Promise((resolve, reject) => {
			searchFields(inputs, ["rg"])
				.then((rgResult) => {
					if (rgResult.length > 0) {
						//console.log("Found RG");
						mapTextInput(rgResult, "RG");
						resolve("FOUND_RG");
					} else {
						resolve("NOT_FOUND_RG");
					}
				})
				.catch((error) => {
					reject(error);
				});
		});
	};

	// Phone filling promise
	this.mapPhonePromise = function () {
		return new Promise((resolve, reject) => {

			Promise.all([
					searchFields(inputs, ["ddd", "area", "areacode"]),
					searchFields(inputs, ["tel", "cel", "cellphone", "telephone"])
				])
				.then(([dddResult, phoneResult]) => {
					if (dddResult.length > 0 && phoneResult.length > 0) {
						// console.log("Found separated phone number");
						mapTextInput(dddResult, "cellphone", "area");
						mapTextInput(phoneResult, "cellphone", "number");
						resolve("FOUND_PHONE_SEPARATE");
					} else if (phoneResult.length > 0) {
						// console.log("Found phone number");
						mapTextInput(phoneResult, "cellphone", "domestic");
						resolve("FOUND_PHONE_FULL");
					} else {
						resolve("NOT_FOUND_PHONE");
					}
				})
				.catch((error) => {
					reject(error);
				});
		});
	};

	// Gender filling promise
	this.mapGenderPromise = function () {
		return new Promise((resolve, reject) => {

			Promise.all([
				searchFields(inputs, ["male", "masculino"]),
				searchFields(inputs, ["female", "feminino"])
				])
				.then(([maleResult, femaleResult]) => {
					maleResult = maleResult[0];
					femaleResult = femaleResult[0];

					if (maleResult && femaleResult) {   // não são indefinidos
						if (maleResult.type === "radio" && femaleResult.type === "radio") {
							//console.log("Found gender radio");
							mapGenderRadio(maleResult, femaleResult);
							resolve("FOUND_GENDER_RADIO");
						}
					} else {
						searchFields(selects, ["gender", "sex"])
							.then((genderSelectResult) => {
								if (genderSelectResult.length > 0) {
									genderSelectResult = genderSelectResult[0];
									//console.log("Found gender select");
									if (genderSelectResult){
										//console.log(genderSelectResult);
										mapGenderSelect(genderSelectResult);
										resolve("FOUND_GENDER_SELECT");
									} else 
										resolve("NOT_FOUND_GENDER");
								} else {
									resolve("NOT_FOUND_GENDER");
								}
							});
					}
				})
				.catch((error) => {
					reject(error);
				});
		});
	};

	// Address filling promise
	this.mapAddressPromise = function () {
		return new Promise((resolve, reject) => {

			Promise.all([
					searchFields(inputs, ["cep", "zip", "postal"]),
					searchFields(inputs, ["number", "numero"]),
					searchFields(inputs, ["complement"]),
					searchFields(inputs, ["reference"]),
					searchFields(inputs, ["city", "cidade"]),
					searchFields(inputs, ["state", "estado"])
				])
				.then(([cepResult, numberResult, complementResult, referenceResult, cityResult, stateResult]) => {
					if (cepResult.length > 0) {
						// console.log("Found CEP");

						if (cepResult[0].value === "")
							mapTextInput(cepResult, "address", "ZIP");
 
						if (numberResult.length > 0) {
							// console.log("Found address number");
							mapTextInput(numberResult, "address", "number");
						}

						if (complementResult.length > 0) {
							// console.log("Found address complement");
							mapTextInput(complementResult, "address", "complement");
						}

						if (referenceResult.length > 0) {
							// console.log("Found address reference");
							mapTextInput(referenceResult, "address", "reference");
						}

						if (cityResult.length > 0) {
							// console.log("Found address city");
							mapTextInput(cityResult, "address", "city");
						}

						if (stateResult.length > 0) {
							// console.log("Found address state");
							mapTextInput(stateResult, "address", "state");
						}

						resolve("FOUND_ADDRESS");
					} else {
						resolve("NOT_FOUND_ADDRESS");
					}
				})
				.catch((error) => {
					reject(error);
				});
		});
	};

	// Form processor promise
	this.processPromise = function () {
		return new Promise((resolve, reject) => {
			Promise.all([
				this.mapNamePromise(),
				this.mapEmailPromise(),
				this.mapCPFPromise(),
				this.mapRGPromise(),
				this.mapPhonePromise(),
				this.mapGenderPromise(),
				this.mapDOBPromise(),
				this.mapAddressPromise()
			])
			.then(values => {
				// console.log(values); // logs results of promises
				//resolve("FILLED_FORM");
				resolve(processedFields);
			})
			.catch((error) => { // should never happen
				console.log(error);
				reject("ERROR_FILLING_FORM");
			});
		});
	};
}


// Input fuzzy search for given fields
function searchFields(inputs, fields) {
	return new Promise((resolve, reject) => {
		var searchOptions = {
			include: ["score"],
			shouldSort: true,
			threshold: 0.20,
			minMatchCharLength: 3,
			keys: [
				"name",
				"id",
				"labels",
				"title",
				"placeholder"
			]
		};

		// console.log(inputs);
		var fuse = new Fuse(inputs, searchOptions);
	
		var results = [];

		// var resultScore = 1.0;
		// var resultInput = null;

		for (let fieldIndex in fields) {
			let result = fuse.search(fields[fieldIndex]);
			results = results.concat(result);
		}

		if(results.length === 0)
			resolve([]);
		else {
			// console.log("results: ", results);
			// sort results by increasing score
			results.sort(function (a, b) {
				return a.score - b.score;
			});

			// remove repeated and already filled results
			var uniqueResults = [];
			for (let resultIndex in results) {
				let result = results[resultIndex];
				if (uniqueResults.indexOf(result) < 0)
					uniqueResults.push(result);
			}

			// console.log("unique results: ", uniqueResults);
			resolve(uniqueResults);
		}
	});
}


// Input fuzzy search for given options
function searchOptions(inputs, fields) {
	return new Promise((resolve, reject) => {
		var searchOptions = {
			include: ["score"],
			shouldSort: true,
			threshold: 0.20,
			minMatchCharLength: 3,
			keys: [
				"value",
				"text"
			]
		};

		var fuse = new Fuse(inputs, searchOptions);

		var results = [];

		// var resultScore = 1.0;
		// var resultInput = null;

		for (let fieldIndex in fields) {
			let result = fuse.search(fields[fieldIndex]);
			results = results.concat(result);
		}

		// sort results by increasing score
		results.sort(function (a, b) {
			return a.score - b.score;
		});

		// remove repeated and already filled results
		var uniqueResults = [];
		for (let resultIndex in results) {
			let result = results[resultIndex].item;
			if (uniqueResults.indexOf(result) < 0)
				uniqueResults.push(result);
		}

		resolve(uniqueResults[0]);
	});
}
