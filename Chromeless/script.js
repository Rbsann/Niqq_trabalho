const chromeless = require("./chromeless.js");
var forms = require("./forms.json");
var notforms = require("./notforms.json");


var runForm = function () {
  while(forms.length > 0) {
    let url = forms.pop();

    chromeless.run(url, true);
  }
};

var runNotForm = function () {
  while(notforms.length > 0) {
    let url = notforms.pop();

    chromeless.run(url, false);
  }
};

try {
  setTimeout(_ => {
      throw "Timeout";
    }, 120000); // Seta timeout da funcao
  runForm();
  runNotForm();
}
catch(error) {
  console.log(error);
}
