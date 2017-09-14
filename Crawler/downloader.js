'use-strict';

const puppeteer = require('puppeteer');
const NinderClient = require('./ninderClient.js');

let ninderClient = new NinderClient();

//TODO: converter para sintaxe de promise
class Downloader{
    constructor(client = ninderClient){
        this.page = await this.startBrowser();
    }

    async startBrowser(){
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        return page;
    }

    killBrowser(){
        this.page.close();
    }

    // Takes an url and returns a screenshot and html code
    async function getDataFrom(url) {
        await this.page.goto(url);
        let screenshot = await this.page.screenshot({ fullPage: true });
        let html = await this.page.content();
    
        return [screenshot, html];
    }
}

module.exports = Downloader;