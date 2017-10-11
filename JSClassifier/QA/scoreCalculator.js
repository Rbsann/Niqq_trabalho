const FeatureExtractor = require("../featureExtractor.js");
const Classifier = require("../classifier.js");
const fs = require('fs');

const sitesWithHtml = require("./sitesWithHtml.json");

var formsScores = [];
var notFormsScores = [];

// Faz um array de Promises ociosas
var classificationPromises = sitesWithHtml.map(siteObject => {
  return new Promise((resolve, reject) => {
    let extractor = new FeatureExtractor(siteObject.url, siteObject.html);
    let classifier = new Classifier();
    
    extractor.getFeatures()
      .then(features => classifier.isForm(features))
      .then(classification => {
        if (siteObject.isForm)
        formsScores.push(classification);
        else 
        notFormsScores.push(classification);

        resolve();
      })
      .catch(error => console.log(error));
  });
});


// Executa todas as Promises do vetor paralelamente depois salva o resultado
Promise.all(classificationPromises)
  .then(_ => {
    // console.log(sitesWithHtml);
    fs.writeFile('formsScores.csv', JSON.stringify(formsScores), 'utf8', (err) => {
      if (err) throw err;
      console.log('The file has been saved!');
    });

    fs.writeFile('notFormsScores.csv', JSON.stringify(notFormsScores), 'utf8', (err) => {
      if (err) throw err;
      console.log('The file has been saved!');
    });
  })
  .catch(error => {
    console.log(error);
  });
