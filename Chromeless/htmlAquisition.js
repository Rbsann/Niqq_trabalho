const chromeless = require("./chromeless.js");
var forms = require("./forms.json");
var notforms = require("./notforms.json");
var remote = true;

var runForm = function () {
  var timeout = 0;
  while(forms.length > 0) {
    let url = forms.pop();
    url = url.replace("https://","");
    url = url.replace("http://","");

    setTimeout(_ => {
      chromeless.run(url, true, remote);
    }, timeout);
    timeout += 3000;
  }
};

var runNotForm = function () {
  // var timeout = 0;
  while(notforms.length > 0) {
    let url = notforms.pop();
    url = url.replace("https://","");
    url = url.replace("http://","");

    // setTimeout(_ => {
      chromeless.run(url, false, remote);
    // }, timeout);
    // timeout += 3000;
  }
};

try {
  setTimeout(_ => {
      throw "Timeout";
    }, 120000); // Seta timeout da funcao
  // runForm();
  runNotForm();
}
catch(error) {
  console.log(error);
}
