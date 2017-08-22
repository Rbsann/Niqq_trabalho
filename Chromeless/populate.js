const chromeless = require("./chromeless.js");
var request = require('request');
var request = require('request-promise-native');


var populateTinderScreenshots = function() {
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
      populateTinderScreenshots();
    })
    .catch(error => {
      console.log(error); // Print the error if one occurred
    });
  
};


var populateTinderHtml = function() {
  var url;
  var requestOptions = {
    url: 'http://localhost:8222/html',
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
      requestOptions.body = {url: url, html: html};
      return request.post(requestOptions);
    })
    .then(response => {
      console.log(response);
      populateTinderHtml();
    })
    .catch(error => {
      console.log(error); // Print the error if one occurred
      // populateTinderHtml();  // arriscado
    });
  
};

populateTinderHtml();
populateTinderHtml();
populateTinderHtml();
populateTinderHtml();
// chromeless.getHtml("https://boards.4chan.org/mu/")
//   .then(html => console.log(html))
//   .catch(error => console.log(error));