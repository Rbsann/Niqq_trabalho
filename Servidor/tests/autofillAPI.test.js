const app = require("../server.js");
const chai = require("chai");
const request = require("supertest"); 
const expect = chai.expect;

function autofillApiTests(user, processAPIResponse){

    let tempToken = '';
    let nameFields = ['nome', 'sobrenome'];
    let contactFields = ['email', 'cpf', 'rg', 'ddd', 'tel'];
    let dateFields = ['dia', 'nasc', 'mes', 'ano'];
    let addressFields = ['cep', 'numero', 'complemento', 'reference', 'cidade', 'estado'];

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

    describe("Form processing test", function(){

        it("should not return mappings for unauthorized user", function(done){
            request(app).post("/autofill/processForm").send({
                email: 'semAutorizacao@teste.com',
                token: 'abcd',
                inputs: nameFields,
                selects: []
            })
            .end(function(err, res){
                expect(res.status).to.be.equal(401);
                done();
            });
        });

        it("should return name mapping", function(done){
            request(app).post("/autofill/processForm").send({
                email: user.email,
                token: tempToken,
                inputs: nameFields,
                selects: []
            })
            .end(function(err, res){
                let data = processAPIResponse(res);
                expect(data.mappedFields.length).to.be.equal(2);

                expect(data.mappedFields[0].mappingIdentifier).to.be.equal("name");
                expect(data.mappedFields[0].mappingSubIdentifier).to.be.equal("first");
                expect(data.mappedFields[1].mappingIdentifier).to.be.equal("name");
                expect(data.mappedFields[1].mappingSubIdentifier).to.be.equal("last");
                done();
            });
        });

        it("should return contact fields mappings", function(done){
            request(app).post("/autofill/processForm").send({
                email: user.email,
                token: tempToken,
                inputs: contactFields,
                selects: []
            })
            .end(function(err, res){
                let data = processAPIResponse(res);
                expect(data.mappedFields.length).to.be.equal(5);
                expect(data.mappedFields[0].mappingIdentifier).to.be.equal("email");
                expect(data.mappedFields[1].mappingIdentifier).to.be.equal("CPF");
                expect(data.mappedFields[2].mappingIdentifier).to.be.equal("RG");

                expect(data.mappedFields[3].mappingIdentifier).to.be.equal("cellphone");
                expect(data.mappedFields[3].mappingSubIdentifier).to.be.equal("area");
                expect(data.mappedFields[4].mappingIdentifier).to.be.equal("cellphone");
                expect(data.mappedFields[4].mappingSubIdentifier).to.be.equal("number");
                done();
            });
        });

        it("should return birth date mappings", function(done){
            request(app).post("/autofill/processForm").send({
                email: user.email,
                token: tempToken,
                inputs: dateFields,
                selects: []
            })
            .end(function(err, res){
                let data = processAPIResponse(res);
                expect(data.mappedFields.length).to.be.equal(3);
                expect(data.mappedFields[0].mappingIdentifier).to.be.equal("DOB");
                expect(data.mappedFields[0].mappingSubIdentifier).to.be.equal("day");
                expect(data.mappedFields[1].mappingIdentifier).to.be.equal("DOB");
                expect(data.mappedFields[1].mappingSubIdentifier).to.be.equal("month");
                expect(data.mappedFields[2].mappingIdentifier).to.be.equal("DOB");
                expect(data.mappedFields[2].mappingSubIdentifier).to.be.equal("year");
                done();
            });
        });

        //TODO: Debug na api com esse input para ver qual é o problema. Atualmente não retorna nada.
        // it("should return gender mapping", function(done){
        //     request(app).post("/autofill/processForm").send({
        //         email: user.email,
        //         token: tempToken,
        //         inputs: ['masculino', 'feminino'],
        //         selects: []
        //     })
        //     .end(function(err, res){
        //         let data = processAPIResponse(res);
        //         console.log(data.mappedFields);
        //         expect(data.mappedFields.length).to.be.equal(1);
        //         done();
        //     });
        // });

        it("should return address mappings", function(done){
            request(app).post("/autofill/processForm").send({
                email: user.email,
                token: tempToken,
                inputs: addressFields,
                selects: []
            })
            .end(function(err, res){
                let data = processAPIResponse(res);
                // TODO: verificar o motivo do cep não estar retornando
                // expect(data.mappedFields.length).to.be.equal(6);
                expect(data.mappedFields[0].mappingIdentifier).to.be.equal("address");
                expect(data.mappedFields[0].mappingSubIdentifier).to.be.equal("number");
                expect(data.mappedFields[1].mappingIdentifier).to.be.equal("address");
                expect(data.mappedFields[1].mappingSubIdentifier).to.be.equal("complement");
                expect(data.mappedFields[2].mappingIdentifier).to.be.equal("address");
                expect(data.mappedFields[2].mappingSubIdentifier).to.be.equal("reference");
                expect(data.mappedFields[3].mappingIdentifier).to.be.equal("address");
                expect(data.mappedFields[3].mappingSubIdentifier).to.be.equal("city");
                expect(data.mappedFields[4].mappingIdentifier).to.be.equal("address");
                expect(data.mappedFields[4].mappingSubIdentifier).to.be.equal("state");
                
                done();
            });
        });

        it("should not return mappings for unrelated field", function(done){
            request(app).post("/autofill/processForm").send({
                email: user.email,
                token: tempToken,
                inputs: ['asdf'],
                selects: []
            })
            .end(function(err, res){
                let data = processAPIResponse(res);
                expect(data.mappedFields).to.be.empty;                
                done();
            });
        });
    });

    describe("Get form score test", function(){
        //TODO: Verificar se este serviço deve ser autenticado
        it("should not return score from unrelated fields", function(done){
            request(app).post("/autofill/getFormScore").send({
                inputs: ['asdf'],
                selects: []
            })
            .end(function(err, res){
                let data = processAPIResponse(res);
                expect(data.formScore).to.be.equal(0);
                done();
            });
        });

        it("should return score for name fields", function(done){
            request(app).post("/autofill/getFormScore").send({
                inputs: nameFields,
                selects: []
            })
            .end(function(err, res){
                let data = processAPIResponse(res);
                expect(data.formScore).to.be.equal(4);
                done();
            });
        });

        it("should return score for contact fields", function(done){
            request(app).post("/autofill/getFormScore").send({
                inputs: contactFields,
                selects: []
            })
            .end(function(err, res){
                let data = processAPIResponse(res);
                expect(data.formScore).to.be.equal(18);
                done();
            });
        });

        it("should return score for date fields", function(done){
            request(app).post("/autofill/getFormScore").send({
                inputs: dateFields,
                selects: []
            })
            .end(function(err, res){
                let data = processAPIResponse(res);
                expect(data.formScore).to.be.equal(6);
                done();
            });
        });
        
        it("should return score for address fields", function(done){
            request(app).post("/autofill/getFormScore").send({
                inputs: addressFields,
                selects: []
            })
            .end(function(err, res){
                let data = processAPIResponse(res);
                expect(data.formScore).to.be.equal(6);
                done();
            });
        });
    });
}

module.exports = autofillApiTests;