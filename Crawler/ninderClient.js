'use-strict';

const request = require('superagent');
const gzip = require('../Chromeless/gzip.js');
const Storage = require('./storage.js');

let storage = new Storage();

class NinderClient{
    constructor(serverUrl = 'https://tinder.niqq.co/'){
        this.screenShotUrl = serverUrl + 'screenshot';
        this.htmlUrl = serverUrl + 'html';
        this.newUrl = serverUrl + 'new';
    }

    // Remove o conteúdo da tag head e retorna o html comprimido
    processHtml(html) {
        html =  "<html>"+html.substring(html.indexOf("<body"));
        return gzip.zip(html);
    }

    // Envia a url e o código html comprimido para o servidor
    postHtml(url, zipped){
        let self = this;
        return new Promise((resolve, reject) => {
            let requestBody = { url: url, html: zipped };
            request
                .post(self.htmlUrl)
                .send(requestBody)
                .end((err, response) => {
                    err ? reject(err) : resolve(response);
                });
        });
    }

    sendHtml(url, html){
        let self = this;
        return new Promise((resolve, reject) => {
            self.processHtml(html)
                .then(zipped => self.postHtml(url, zipped))
                .then(response => resolve(true))
                .catch(err => reject(err));
        });
    }

    postScreenshot(url, storagePath){
        let self = this;
        return new Promise((resolve, reject) => {
            let requestBody = { url: url, imageUrl: storagePath };
            request
                .post(self.screenShotUrl)
                .send(requestBody)
                .end((err, response) => {
                    err ? reject(err) : resolve(response);
                });
        });
    }
    sendScreenshot(url, screenshot){
        let self = this;
        return new Promise((resolve, reject) => {
            storage
                .uploadFile(screenshot)
                .then(storagePath => self.postScreenshot(url, storagePath))
                .then(response => resolve(true))
                .catch(err => reject(err));
        });
    }

    // GET request genérica
    getRequest(url){
        return new Promise((resolve,reject) => {
            request.get(url)
                .end((err, response) => {
                    if(response.body)
                        console.log(response.body);
                    err ? reject(err) : resolve(response.body);
                });
        });
    }
    // Returns the next url from database without html code
    getNextUrlToDownloadHtml(){
        return this.getRequest(this.htmlUrl);
    }

    // Return the next url form database without screenshot
    getNextUrlToScreenshot(){
        return this.getRequest(this.screenShotUrl);
    }

    new(urls){
        let self = this;
        return new Promise((resolve, reject) => {
            let requestBody = { urls: urls };
            request
                .post(self.newUrl)
                .send(requestBody)
                .end((err, response) => {
                    err ? reject(err) : resolve(response);
                });
        });
    }
}

module.exports = NinderClient;