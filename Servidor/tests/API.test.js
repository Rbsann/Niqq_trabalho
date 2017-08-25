const app = require("../server.js");
const chai = require("chai");
const request = require("supertest"); 
const expect = chai.expect;

//Testes
const userApiTests = require('./userAPI.test.js');
const autofillApiTests = require('./autofillAPI.test.js');

var processAPIResponse = function(res) {
	expect(res.statusCode).to.equal(200);
	if (res.body.error === 1) {
		console.log("Error message:", res.body.body.message);
	}
	expect(res.body.error).to.equal(0);
	return res.body.body;
};

before(done => {
	app.on("serverReady", _ => done());
});

describe("API integration test", function() {
	var user = {
		email: "testuser@niqq.in",
		password: "password",
		data: {
			name: {
				first: "Primeironome",
				last: "Últimonome"
			},
			gender: "female"
		},
		encryptedData: {}
	};

	describe("AccountAPI", function() {
		describe("Test set up", function() {
			it ("should delete previous test user", function(done) {
				this.timeout(5000);
				request(app).post("/account/removeUser").send({email: user.email})
					.end(function(err, res) {
						var data = processAPIResponse(res);
						expect(data.done).to.equal(true);
						done();
					});
			});
		});

		describe("Sign up test", function() {
			it("should create a new user", function(done) {
				request(app).post("/account/signup").send(user)
					.end(function(err, res) {
						var data = processAPIResponse(res);
						expect(data.firstName).to.be.equal(user.data.name.first);
						expect(data.token).to.be.a("string");
						done();
					});
			});
			it("should check if test user email is in database", function(done) {
				request(app).post("/account/checkEmail").send({email: user.email})
					.end(function(err, res) {
						var data = processAPIResponse(res);
						expect(data.emailSignedUp).to.be.equal(true);
						done();
					});
			});
		});

		describe("Login/logout test", function() {
			 var tempToken = "";
			it("should perform login", function(done) {
				request(app).post("/account/login").send({email: user.email, password: user.password})
					.end(function(err, res) {
						var data = processAPIResponse(res);
						expect(data.firstName).to.be.equal(user.data.name.first);
						expect(data.gender).to.be.equal(user.data.gender);
						expect(data.token).to.be.a("string");
						tempToken = data.token;
						done();
					});
			});
			it("should perform logout", function(done) {
				request(app).post("/account/logout").send({token: tempToken})
					.end(function(err, res) {
						var data = processAPIResponse(res);
						expect(data.loggedOut).to.be.equal(true);
						done();
					});
			});
		});

	});

	describe("UserAPI", function(){
		userApiTests(user, processAPIResponse);
	});

	describe("AutofillAPI", function(){
		autofillApiTests(user, processAPIResponse);
	});
});