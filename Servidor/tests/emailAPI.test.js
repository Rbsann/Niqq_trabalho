const app = require("../server.js");
const chai = require("chai");
const request = require("supertest");
const expect = chai.expect;
var tempToken = "";
const emailAPI = require("../api_modules/emailAPI");


function emailApitests(user, processAPIResponse){
    
describe("EmailAPI", function () {
    var user = {
        email: "testuser@niqq.in",
        password: "password",
        data: {
            name: {
                first: "Primeironome",
                last: "Últimonome"
            },
            gender: "female"
        }
    };

    before("User login before tests", function (done) {
        this.timeout(5000);
        request(app).post("/account/login").send({ email: user.email, password: user.password })
            .end(function (err, res) {
                var data = processAPIResponse(res);
                expect(data.firstName).to.be.equal(user.data.name.first);
                expect(data.gender).to.be.equal(user.data.gender);
                expect(data.token).to.be.a("string");
                tempToken = data.token;
                done();
            });
    });

    describe("Send help email", function () {
        it("should send help email", function (done) {
            request(app).post("/email/sendHelp").send({
                token: tempToken,
                email: user.email,
                message: "123 teste"
            })
                .end(function (err, res) {
                    let userEmail = processAPIResponse(res);
                    expect(userEmail.emailSent).to.be.equal(true);
                    done();

                });
        });
        // erro no codigo encontrado, sempre retorna true.
        it("should not send email due to non-existant user", function (done) {
            request(app).post("/email/sendHelp").send({
                token: tempToken,
                email: 'aaa@aaa.com',
                message: "Qualquer coisa"
            })
                .end(function (err, res) {
                    let userEmail = processAPIResponse(res);
                    expect(userEmail.emailSent).to.be.equal(false);
                    done();
                });
        });

        it("should not send email due to user not logged in", function (done) {
            request(app).post("/email/sendHelp").send({
                token: 12345,
                email: user.email,
                message: 'Mensagem'
            })
                .end(function (err, res) {
                    expect(res.statusCode).to.be.equal(401);
                    done();
                });
        });

    });


});
}
module.exports=emailApitests;