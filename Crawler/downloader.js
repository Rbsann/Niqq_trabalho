'use-strict';

const puppeteer = require('puppeteer');
const NinderClient = require('./ninderClient.js');

var randomString = function(length) {
    var text = "";
    var alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
    for (var i = 0; i < length; i++) {
        text += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
    }
    return text;
};

class Downloader {
    constructor(idNumber) {
        this.browser = null;
        this.page = null;
        this.basePath = 'images/';
        this.idNumber = idNumber;
    }

    // creates browser and page
    initialize() {
        let self = this;
        return new Promise((resolve, reject) => {
            self.createBrowser()
                .then(_ => self.createPage())
                .then(_ => resolve(true))
                .catch(error => reject(error));
        });
    }

    // instantiate puppeteer browser object
    createBrowser() {
        let self = this;
        return new Promise((resolve, reject) => {
            if (self.browser !== null) {
                resolve(self.browser);
            } else {
                console.log(`Downloader ${self.idNumber}: creating browser`);
                puppeteer.launch({ignoreHTTPSErrors: true})
                    .then(browser => {
                        self.browser = browser;
                        resolve(browser);
                    })
                    .catch(error => reject(error));
            }
        });
    }

    createPage() {
        let self = this;
        return new Promise((resolve, reject) => {
            if (self.browser === null) {
                reject(Error("ERR_BROWSER_NOT_STARTED"));
            } else if (self.page !== null) {
                resolve(self.page);
            } else {
                console.log(`Downloader ${self.idNumber}: creating page`);
                self.browser.newPage()
                    .then(page => {
                        self.page = page;
                        resolve(page);
                    })
                    .catch(error => reject(error));
            }
        });
    }

    navigateToURL(url) {
        let self = this;
        return new Promise((resolve, reject) => {
            if (self.page === null) {
                reject(Error("ERR_PAGE_NOT_CREATED"));
            } else {
                console.log(`Downloader ${self.idNumber}: navigating to`, url);
                self.page.goto(url, { timeout: 15000 , waitUntil: 'networkidle' })
                    .then(_ => {
                        resolve(true);
                        // if (response && response.ok) {
                        //     resolve(true);
                        // } else {
                        //     reject(Error("ERR_LOADING_URL"));
                        // }
                    })
                    .catch(error => reject(error));
            }
        });
    }

    closeBrowser() {
        console.log(`Downloader ${self.idNumber}: closing browser`);
        return this.browser.close();
    }

    //Tira uma screenshot da página, armazena no disco e retorna o caminho
    getScreenshot(imagePath) {
        let self = this;
        return new Promise((resolve, reject) => {
            if (self.page === null) {
                reject(Error("ERR_PAGE_NOT_CREATED"));
            } else {
                console.log(`Downloader ${self.idNumber}: taking screenshot`);
                self.page.screenshot({ path: imagePath, fullPage: true })
                    .then(_ => resolve(imagePath))
                    .catch(err => reject(err));
            }
        });
    }

    getHtml(data, page) {
        let self = this;
        return new Promise((resolve, reject) => {
            if (self.page === null) {
                reject(Error("ERR_PAGE_NOT_CREATED"));
            } else {
                console.log(`Downloader ${self.idNumber}: getting HTML`);
                self.page.content()
                    .then(html => resolve(html))
                    .catch(err => reject(err));
            }
        });
    }

    fileName(url) {
        let urlReference = url.match('^(?:http:\/\/|www\.|https:\/\/)([^\/]+)')[1];
        if(urlReference.indexOf('www') > -1)
            urlReference = urlReference.replace('www', '');
        return this.basePath + urlReference.replace(/\./g, '') + '_' + randomString(10) + '.png';
    }

    getDataFrom(url) {
        let self = this;
        return new Promise((resolve,reject) => {
            if (this.browser === null) {
                reject(Error("ERR_BROWSER_NOT_CREATED"));
            } else {
                console.log(`Downloader ${self.idNumber}: getting data from`, url);

                let data = {
                    screenshot: null,
                    html: null
                };

                this.navigateToURL(url)
                    .then(_ => this.getScreenshot(self.fileName(url)))
                    .then(screenshot => {
                        data.screenshot = screenshot;
                        return this.getHtml();
                    })
                    .then(html => {
                        data.html = html;
                        resolve(data);
                    })
                    .catch(error => reject(error));
            }
        });
    }
}

module.exports = Downloader;