'use strict';

const puppeteer = require('puppeteer');
const NinderClient = require('./ninderClient.js');

const search = "http://bing.com/search?q=instreamset:(url title):cadastro&count=20";

class UrlCatcher{
    constructor(){
        this.browser;
        this.page;
    }

    getTempLiks(){
        let self = this;
        return self.page.evaluate(() => {
            return new Promise((resolve, reject) => {
                let anchors = Array.from(document.querySelectorAll('cite'));
                resolve(anchors.map(anchor => anchor.textContent));
                // console.log(anchor);
            });
        });
    }
search(numPage) {
    let self = this;
    return new Promise((resolve, reject) => {
        puppeteer
            .launch()
            .then((newBrowser) => {
                self.browser = newBrowser;
                return self.browser.newPage();
            })
            .then((newPage) => {
                self.page = newPage;
                let pageUrl = search + '&first=' + numPage + '&FORM=PERE';
                return self.page.goto(pageUrl);
            })
            .then(() => self.page.waitForSelector('h2 a'))
            .then(() => self.getTempLiks())
            .then((tempLinks) => {
                resolve(tempLinks);
            })
            .catch(err => {
                console.log(err);
                reject(err);
            });
        });
    }
}

function run(){
    let ninderClient = new NinderClient();
    let catcher = new UrlCatcher();
    let links = [];

    for (let x = 1; x < 101; x = x + 20) {
        catcher.search(x)
            .then((tempLinks) => ninderClient.new(tempLinks))
            .then((response) => {
                console.log(response);
            })
            .catch(err => {
                console.log(err);
            });
    }
}

run();