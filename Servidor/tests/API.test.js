const app = require("../server.js");
const chai = require("chai");
const request = require("supertest"); 
const expect = chai.expect;

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

	var tempToken = "";

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
			// var tempToken = "";
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
		var loggedInUser = {
			'token': tempToken,
			'email': user.email
		};

		before("User login before tests",function(done){
			this.timeout(5000);
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

		describe("Get all user information test", function(){
			it("should not return data to unauthorized users", function(done){
				request(app).post("/user/getAllInfo").send({token: '', email: ''})
				.end(function(err, res){
					expect(res.statusCode).to.be.equal(401);
					done();
				});
			});

			it("should query all user information", function(done){
				request(app).post("/user/getAllInfo").send({
					token: tempToken,
					email: user.email
				})
				.end(function(err, res){
					let data = processAPIResponse(res);
					expect(data.data.name.first).to.be.equal(user.data.name.first);
					expect(data.encryptedData).to.not.be.null;
					done();
				});
			});

		});

		describe("User password tests", function(){
			it("should not change password if original password is wrong", function(done){
				request(app).post('/user/changePassword').send({ 
					token: tempToken,
					email: user.email,
					currentPassword: "wrongPassword",
					newPassword: '123',
					encryptedData: user.encryptedData,
				})
				.end(function(err, res){
					expect(res.body.error).to.be.equal(1);
					done();
				});
			});

			it("should change user password" , function(done){
				request(app).post('/user/changePassword').send({ 
					token: tempToken,
					email: user.email,
					currentPassword: user.password,
					newPassword: user.password,
					encryptedData: user.encryptedData,
				})
				.end(function(err, res){
					let data = processAPIResponse(res);
					expect(data.changed).to.be.true;
					done();
				});
			});

			//TODO: Verificar se alguma correção é necessária no serviço de resetar password
			// it("should not request password reset with invalid email", function(done){
			// 	request(app).post('/user/requestPasswordReset').send({ email: user.email})
			// 	.end(function(err, res){
			// 		
			// 		let data = processAPIResponse(res);
			// 		done();
			// 	});
			// });

			// it("should request password reset email", function(done){
			// 	request(app).post('/user/requestPasswordReset').send({ email: user.email})
			// 	.end(function(err, res){
			// 		//TODO: Verificar se correção é necessária no serviço de resetar password
			// 		let data = processAPIResponse(res);
			// 		expect(data.requestReceived).to.be.true;
			// 		done();
			// 	});
			// });

			it("should not reset password when password reset code is wrong", function(done){
				request(app).post('/user/resetPassword').send({ 
					password: user.password,
					passwordResetCode: 'wrongCode'
				})
				.end(function(err, res){
					expect(res.body.error).to.not.be.equal(0);
					done();
				});
			});
			// TODO: Como testar o serviço de resetar senha tem que abrir o email com o código?

		});

		describe("Update user information test", function(){
			it("should not update user info if user is not logged in", function(done){
				request(app).post('/user/editInfo').send({
					email: user.email,
					token: "invalidToken",
					data: user.data,
					encryptedData: user.encryptedData
				})
				.end(function(err, res){
					expect(res.statusCode).to.be.equal(401);
					done();
				});
			});

			it("should update user info", function(done){
				request(app).post('/user/editInfo').send({
					email: user.email,
					token: tempToken,
					data: user.data,
					encryptedData: {}
				})
				.end(function(err, res){
					let data = processAPIResponse(res);
					expect(data.edited).to.be.equal('true');
					done();
				});
			});
		});

		// describe("Facebook user authentication test", function(){});
		// describe("User credential tests", function(){});
	});
});