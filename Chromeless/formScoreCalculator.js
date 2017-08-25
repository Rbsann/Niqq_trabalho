const autofill = require("./autofill.js");
const fs = require("fs");
var glob = require("glob");
var forms = require("./forms.json");
var notforms = require("./notforms.json");


function calculateScore (form = function(){throw new Error('Missing parameter');}()) {
  var formOrNotForm;
  if (form)
    formOrNotForm = "form";
  else
    formOrNotForm = "notform";

  glob("./outputs/"+formOrNotForm+"/*.html", function (error, fileNames) {
    var formScoresPromises = fileNames.map(file => {
      return new Promise ((resolve, reject) => {
        fs.readFile(file, "utf8", function(err, html) {
          autofill.loadHTML(html);
          autofill.getFormScore()
            .then(score => {
              // let formElement = {};
              // let domainDotHtml = file.split("/")[3];
              // formElement.site = domainDotHtml.substring(0, domainDotHtml.length-5);
              // formElement.score = score.formScore;
              // console.log(formElement);

              resolve(score.formScore);
            })
            .catch(error => {
              console.log(error);
              reject(error);
            });
        });
      });
    });

    Promise.all(formScoresPromises)
      .then(formScores => {
        // console.log(formScores);
        let file = fs.createWriteStream("./outputs/"+formOrNotForm+"Scores.csv");
        file.write(JSON.stringify(formScores));
        file.end();
      })
      .catch(error => {
        console.log(error);
      });
  });
}

calculateScore(true);
calculateScore(false);
