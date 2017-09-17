'use-strict';

const puppeteer = require('puppeteer');
const NinderClient = require('./ninderClient.js');

class Downloader{
    constructor(){
        this.browser;
        this.basePath = 'images/';
    }

    //Cria um browser e direciona para dada url
    startBrowser(url){
        let self = this;
        return new Promise((resolve, reject) => {
            puppeteer.launch()
                .then(newBrowser => {
                    self.browser = newBrowser;
                    return newBrowser.newPage();
                })    
                .then(page => {
                    self.page = page;
                    return page.goto(url, {timeout: 50000, waitUntil : "networkidle"});
                })
                .then(response => {
                    if(!response)
                        reject("COULD_NOT_OPEN_URL");
                    if(response.ok)
                        resolve(self.page);
                    else
                        reject(response);
                })
                .catch(err => reject(err));
        });
    }

    fileName(url){
        let name = url.match(/\.(.*?)\./);
        let urlReference = name && name.length > 0 ? name[1] : "";
        if(urlReference.length === 0)
            urlReference = 'image' + Math.random(0,1000);
        else
            urlReference = urlReference.replace('/', '');
        return this.basePath + urlReference + '.png';
    }

    //Tira uma screenshot da página, armazena no disco e retorna o caminho
    getScreenshot(data, page, url){
        let self = this;
        return new Promise((resolve, reject) => {
            let imagesPath = self.fileName(url);
            page.screenshot({ path: imagesPath, fullPage: true })
                .then(screenshot => {
                    data.screenshot = imagesPath;
                    resolve(page);
                })
                .catch(err => reject(err));
        });
    }

    getHtml(data, page){
        return new Promise((resolve, reject) => {
            page.content()
                .then(html => {
                    data.html = html;
                    resolve(page);
                })
                .catch(err => {
                    console.log(err);
                    reject(err);
                });
        });
    }
    getDataFrom(url){
        let self = this;
        return new Promise((resolve,reject) => {
            let data = {};
            this.startBrowser(url)
                .then(page => this.getScreenshot(data, page, url))
                .then(page => this.getHtml(data, page))
                .then(_ => {
                    self.browser.close();
                    resolve([data.screenshot, data.html]);
                })
                .catch(err => {
                    self.browser.close();
                    // TODO: implementar um sistema de logging para registrar URLs falhas
                    if(err.ok === false)
                        reject("COULD_NOT_LOAD_PAGE");
                    reject(err);
                });
        });
    }
}

module.exports = Downloader;