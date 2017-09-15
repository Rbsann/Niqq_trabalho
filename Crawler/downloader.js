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
                    return page.goto(url);
                })
                .then(_ => resolve(self.page))
                .catch(err => reject(err));
        });
    }

    //Tira uma screenshot da página, armazena no disco e retorna o caminho
    getScreenshot(data, page, url){
        let self = this;
        return new Promise((resolve, reject) => {
            console.log(url);
            let imagesPath = self.basePath + url.match(/\.(.*?)\./)[1] + '.png';
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
                .catch(err => reject(err));
        })
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
                    reject(err);
                });
        });
    }
}

module.exports = Downloader;