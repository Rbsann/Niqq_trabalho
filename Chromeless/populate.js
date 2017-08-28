const chromeless = require("./chromeless.js");
const gzip = require('./gzip.js');
var request = require('request');
var request = require('request-promise-native');


var populateNinderScreenshots = function() {
  var url;
  var requestOptions = {
    url: 'https://tinder.niqq.co/screenshot',
    json: true,
    followAllRedirects: true, 
    followOriginalHttpMethod: true,
    headers: {
      "Content-type": "application/json"
    }
  };

  request.get(requestOptions)
    .then(body => {
      url = body.url;
      return chromeless.getScreenshot(url);
    })
    .then(s3Url => {
      requestOptions.body = {url: url, imageUrl: s3Url};
      return request.post(requestOptions);
    })
    .then(response => {
      console.log(response);
      populateNinderScreenshots();
    })
    .catch(error => {
      console.log(error); // Print the error if one occurred
    });
  
};


var populateNinderHtml = function() {
  var url;
  var requestOptions = {
    url: 'https://tinder.niqq.co/html',
    json: true,
    followAllRedirects: true, 
    followOriginalHttpMethod: true,
    headers: {
      "Content-type": "application/json"
    }
  };

  request.get(requestOptions)
    .then(body => {
      url = body.url;
      return chromeless.getHtml(url);
    })
    .then(html => {
      var body = "<html>"+html.substring(html.indexOf("<body"));  // removes <head>
      return gzip.zip(body);
    })
    .then(zippedHtml => {
      requestOptions.body = {url: url, html: zippedHtml};
      // console.log(requestOptions);
      return request.post(requestOptions);
    })
    .then(response => {
      console.log("respo: ", response);
      populateNinderHtml();
      var prob = Math.random();
    })
    .catch(error => {
      console.log(error); // Print the error if one occurred
      populateNinderHtml();  // arriscado
    });
  
};

var getSignupPages = function(instances = 1, startNumber = 0) {
  var requestOptions = {
    url: 'https://tinder.niqq.co/new',
    json: true,
    followAllRedirects: true, 
    followOriginalHttpMethod: true,
    headers: {
      "Content-type": "application/json"
    }
  };

  console.log("Starting from result #"+startNumber);
  chromeless.googleQuery("https://www.google.com.br/search?q=site:*/cadastro&num=100&start="+startNumber, 2)
    .then(results => {
      console.log("Results: ", results);
      // requestOptions.body = {urls: results};
      // request.post(requestOptions);
      // setTimeout(() => getSignupPages(instances, startNumber+(100*instances)), Math.random()*10000);
    })
    .catch(error => {
      console.log(error);
    });
};

var createInstances = function(number) {
  var startNumber = 100;
  for(let i = 0; i < number; i++){
    getSignupPages(number, startNumber);
    startNumber += 100;
  }
};

// // getSignupPages(500, 0);
// populateNinderScreenshots();
populateNinderHtml();
populateNinderHtml();
populateNinderHtml();
populateNinderHtml();
populateNinderHtml();
populateNinderHtml();
populateNinderHtml();
populateNinderHtml();
populateNinderHtml();
populateNinderHtml();
populateNinderHtml();
populateNinderHtml();