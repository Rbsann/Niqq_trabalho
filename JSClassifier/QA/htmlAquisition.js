const Downloader = require("../../Crawler/downloader.js");
const fs = require('fs');
const sites = require("./sites.json");

var downloader = new Downloader();
var sitesWithHtml = [];


// Faz uma cadeia (ou corrente) de Promises para executarem uma após o término da outra (Puppeteer não faz paralelo)
var promiseChain = sites.reduce((chain, siteObject) => {
  return chain.then(_ => {
    return new Promise((resolve, reject) => {
      downloader.startBrowser(siteObject.url)
        .then(page => downloader.getHtml(siteObject, page))
        .then(result => {
          downloader.stopBrowser();
          // console.log(siteObject);
          sitesWithHtml.push(siteObject);
          resolve();
        })
        .catch(error => {
          downloader.stopBrowser();
          // reject(error);
          resolve();
        });
    });
  });
}, Promise.resolve());


// Salva arquivo após toda cadeia de Promises ser executada
promiseChain.then(_ => {
    // console.log(sitesWithHtml);
    fs.writeFile('sitesWithHtml.json', JSON.stringify(sitesWithHtml), 'utf8', (err) => {
      if (err) throw err;
      console.log('The file has been saved!');
    });
  })
  .catch(error => {
    console.log(error);
  });