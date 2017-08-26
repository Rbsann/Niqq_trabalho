const app = require("../server.js");
const chai = require("chai");
const request = require("supertest");
const expect = chai.expect;
var tempToken = "";


function catalogApiTests(user, processAPIResponse){

describe("CatalogAPI", function () {

  
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

    describe("entry update tests", function () {
        it("create new entry for url", function (done) {
            request(app).post("/catalog/updateEntry").send({
                email: user.email,
                token: tempToken,
                url: 'https://www.zendesk.com/register/',
                fields: []
            })
                .end(function (err, res) {
                    let updatedEntry = processAPIResponse(res);
                    expect(updatedEntry.updatedEntry).not.to.be.equal({});
                    done();
                });
        });

        it("should return an error message due to wrong url", function (done) {
            request(app).post("/catalog/updateEntry").send({
                email: user.email,
                token: tempToken,
                fields: []
            })
                .end(function (err, res) {
                    expect(res.body.body.message).to.be.equal("INCOMPLETE_REQUEST");
                    done();
                });
        });

        it("should return an error message due to absence of fields", function (done) {
            request(app).post("/catalog/updateEntry").send({
                email: user.email,
                token: tempToken,
                url: 'www.12345.com'

            })
                .end(function (err, res) {
                    expect(res.body.body.message).to.be.equal("INCOMPLETE_REQUEST");
                    done();
                });

        });

        it("should update entry for existing url", function (done) {
            request(app).post("/catalog/updateEntry").send({
                email: user.email,
                token: tempToken,
                url: 'https://www.zendesk.com/register/',
                fields: []

            })
                .end(function (err, res) {
                    let updatedEntry = processAPIResponse(res);
                    expect(updatedEntry.updatedEntry).to.be.equal(true);
                    done();

                });
        });

    });

    describe("get entry from a given url", function () {
        it("should return an error message due to a malformed url", function (done) {
            request(app).post("/catalog/getEntry").send({
                email: user.email,
                token: tempToken,
            })
                .end(function (err, res) {
                    expect(res.body.body.message).to.be.equal("Malformed request");
                    done();
                });
        });

        it("should return an error due to url not being a form", function (done) {
            request(app).post("/catalog/getEntry").send({
                email: user.email,
                token: tempToken,
                url: 'www.12345.com'
            })
                .end(function (err, res) {
                    expect(res.body.body.message).to.be.equal("ENTRY_NOT_FORM");
                    done();
                });
        });

        it("should return best field mapping", function (done) {
            request(app).post("/catalog/getEntry").send({
                email: user.email,
                token: tempToken,
                url: 'https://www.zendesk.com/register/'
            })
                .end(function (err, res) {
                    expect(res.body.body.message).to.be.equal("ENTRY_NOT_FORM");
                    expect(res.body.error).to.be.equal(1);
                    done();
                });
        });

    });

});
}
module.exports=catalogApiTests;