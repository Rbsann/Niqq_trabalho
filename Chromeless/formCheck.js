const autofill = require("./autofill.js");
const fs = require("fs");
var glob = require("glob");

var formOrNotForm = "notform"; // "form"

glob("./outputs/"+formOrNotForm+"/*.html", function (error, fileNames) {
  var formScoresPromises = fileNames.map(file => {
    return new Promise ((resolve, reject) => {
      fs.readFile(file, "utf8", function(err, html) {
        autofill.loadHTML(html);
        autofill.getFormScore()
          .then(score => {
            let formElement = {};
            formElement.site = file.split("/")[3];
            formElement.score = score.formScore;
            console.log(formElement);

            resolve(formElement);
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
      let file = fs.createWriteStream("./outputs/"+formOrNotForm+"Scores.json");
      file.write(JSON.stringify(formScores));
      file.end();
    })
    .catch(error => {
      console.log(error);
    });
});

