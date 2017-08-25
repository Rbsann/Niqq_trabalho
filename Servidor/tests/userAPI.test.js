const app = require("../server.js");
const chai = require("chai");
const request = require("supertest"); 
const expect = chai.expect;

function userApiTests(user, processAPIResponse){
    let tempToken;
    let loggedInUser = {
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
        //     request(app).post('/user/requestPasswordReset').send({ resetEmail: null})
        //     .end(function(err, res){
        //         expect(res.body.error).to.be.equal(1);
        //         done();
        //     });
        // });

        it("should request password reset email", function(done){
            request(app).post('/user/requestPasswordReset').send({ resetEmail: user.email})
            .end(function(err, res){
                let data = processAPIResponse(res);
                expect(data.requestReceived).to.be.true;
                done();
            });
        });

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
        // TODO: Como testar o serviço de resetar senha sem ter que abrir o email com o código? (débito técnico)

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

}

module.exports = userApiTests;