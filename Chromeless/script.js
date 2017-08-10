const chromeless = require("./chromeless.js");
var forms = require("./forms.json");
var notforms = require("./notforms.json");


var runForm = function () {
  if (forms.length > 0) {
    let url = forms.pop();

    chromeless.run(url, true);
  }
};

var runNotForm = function () {
  if (notforms.length > 0) {
    let url = notforms.pop();

    chromeless.run(url, false);
  }
};

// runForm();
// runNotForm();]
chromeless.run("https://id.atlassian.com/signup", true);
chromeless.run("https://carrinho.ricardoeletro.com.br/Cliente/Cadastro", true);