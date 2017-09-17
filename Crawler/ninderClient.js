'use-strict';

const request = require('superagent');
const gzip = require('../Chromeless/gzip.js');

class NinderClient{
    constructor(serverUrl = 'https://tinder.niqq.co/'){
        this.screenShotUrl = serverUrl + 'screenshot';
        this.htmlUrl = serverUrl + 'html';
    }

    // Remove o conteúdo da tag head e retorna o html comprimido
    processHtml(html) {
        html =  "<html>"+html.substring(html.indexOf("<body"));
        return gzip.zip(html);
    }

    // Envia a url e o código html comprimido para o servidor
    postHtml(url, zipped){
        return new Promise((resolve, reject) => {
            let requestBody = { url: url, html: zipped };
            request
                .post(this.htmlUrl)
                .send(requestBody)
                .end((err, response) => {
                    err ? reject(err) : resolve(response);
                });

        });
    }

    sendHtml(url, html){
        return new Promise((resolve, reject) => {
            this.processHtml(html)
                .then(zipped => this.postHtml(url, zipped))
                .then(response => resolve(true))
                .catch(err => reject(err));
        });
    }

    sendScreenshot(url, screenshot){
        let self = this;
    }
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
    getNextUrlToDownloadHtml(url){
        return this.getRequest(this.htmlUrl);
    }

    // Return the next url form database without screenshot
    getNextUrlToScreenshot(){
        return this.getRequest(this.screenShotUrl);
    }
}

module.exports = NinderClient;