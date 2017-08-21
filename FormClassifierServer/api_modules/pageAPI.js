// Import modules
var bodyParser = require('body-parser');
var Page = require("../models/page.js");
const pageRoutes = require('express').Router();

// JSON request and response middleware
pageRoutes.use(bodyParser.json());

/// Put new unclassified urls in the bank
/// - Request data: {urls: [String]}
/// - Responde data: {urlsInserted: Boolean}
pageRoutes.post("/new", (request, response) => {
  var urls = request.body.urls;
  if (urls === undefined || urls === null) 
    response.status(400).send("Malformed request");
    
  var insertionPromises = urls.map(url => {  // array of Promises
    Page.insert(url); 
  });

  Promise.all(insertionPromises)
    .then(_ => {
      response.send({urlsInserted: true});
    })
    .catch(error => {
      console.log(error);
      response.status(500).send({urlsInserted: false});
    });
});

/// Get a random unclassified url to classify
/// - Request data: none
/// - Response data: {url: String, imageUrl: String}
pageRoutes.get("/classify", (request, response) => {
  Page.getPageToClassify()
    .then(page => {
      response.send({url: page.url, imageUrl: page.imageUrl});
    })
    .catch(error => {
      console.log(error);
      response.status(500).send("Server error");
    });
});


/// Classify the url
/// - Request data: {url: String, isForm: Boolean}
/// - Response data: {urlClassified: Boolean}
pageRoutes.post("/classify", (request, response) => {
  var url = request.body.url;
  var isForm = request.body.isForm;
  if (url === undefined || url === null || isForm === undefined || isForm === null) 
    response.status(400).send("Malformed request");

  Page.classify(payload.url, payload.isForm)
    .then(_ => {
      response.send({urlClassified: true});
    })
    .catch(error => {
      console.log(error);
      response.status(500).send({urlClassified: false});
    });
});

/// Get a random unclassified url without screenshot to screenshot
/// - Request data: none
/// - Response data: {url: String}
pageRoutes.get("/screenshot", (request, response) => {
  Page.getPageToScreenshot()
    .then(page => {
      response.send({url: page.url});
    })
    .catch(error => {
      console.log(error);
      response.status(500).send("Server error");
    });
});


/// Save the url screenshot
/// - Request data: {url: String, imageUrl: String}
/// - Response data: {imageSaved: Boolean}
pageRoutes.post("/screenshot", (request, response) => {
  var url = request.body.url;
  var imageUrl = request.body.imageUrl;
  if (url === undefined || url === null || imageUrl === undefined || imageUrl === null) 
    response.status(400).send("Malformed request");

  Page.updateImageUrl(url, imageUrl)
    .then(_ => {
      response.send({imageSaved: true});
    })
    .catch(error => {
      console.log(error);
      response.status(500).send({imageSaved: false});
    });
});

module.exports = pageRoutes;