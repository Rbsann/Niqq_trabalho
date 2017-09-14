'use-strict';

const Downloader = require('./downloader.js');
const NinderClient = require('./ninderClient.js');

class Populate{
    constructor(){
        let self = this;
        self.client = new NinderClient();
        self.downloader = new Downloader();
    }

    // populateDataset(){
    //     self.client.getNextUrlToDownloadHtml()
    //         .then(url => self.downloader.getDataFrom(url))
    //         .then(data => self.client.sendHtml(url, data[1]))
    //         .then(_ => )
    // }
}