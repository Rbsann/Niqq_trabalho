'use-strict';

const Downloader = require('./downloader.js');
const NinderClient = require('./ninderClient.js');

class Populate{
    constructor(){
        let self = this;
        self.client = new NinderClient();
        self.downloader = new Downloader();
    }

    /*
        Popula o servidor com dados passíveis de classificação manual.
    */
    populateDataset(){
        let self = this;
        let url = "";
        return new Promise((resolve, reject) => {
            self.client.getNextUrlToDownloadHtml()
                .then(response => {
                    url = response.url;
                    return self.downloader.getDataFrom(url);
                })
                .then(data => {
                    Promise.all(
                        self.client.sendScreenshot(url, data[0]),
                        self.client.sendHtml(url, data[1])
                    );
                })
                .then(_ => resolve(true))
                .catch(error => {
                    reject(error);
                });

        });
    }
}

module.exports = Populate;