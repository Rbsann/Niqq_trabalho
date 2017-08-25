var formScores = require("./outputs/formScores.json");
var notformScores = require("./outputs/notformScores.json");

var nullForms = 0;

var formScoresSum = formScores.reduce(function(sum, site) {
  if(site.score <= 0)
    nullForms++;

  return sum + site.score;
}, 0);

var notformScoresSum = notformScores.reduce(function(sum, site) {
  return sum + site.score;
}, 0);

console.log("Forms: "+ (formScores.length-nullForms));
console.log("Forms score sum: "+ formScoresSum);
console.log("Forms score mean: "+ formScoresSum/(formScores.length-nullForms));
console.log("Notforms: "+ notformScores.length);
console.log("Notforms score sum: "+ notformScoresSum);
console.log("Notforms score mean: "+ notformScoresSum/notformScores.length);