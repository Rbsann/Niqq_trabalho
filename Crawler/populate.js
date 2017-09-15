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
        return new Promise((resolve, reject) => {
            this.client.getNextUrlToDownloadHtml()
                .then(response => this.downloader.getDataFrom(response.url))
                .then(data => {resolve(data)})
                    // return Promise.all(
                    //     self.client.sendScreenshot(url, data[0]),
                    //     self.client.sendHtml(url, data[1])
                    // )})
                // .then(_ => resolve(true))
                .catch(error => {
                    reject(error);
                });

        });
    }
}

let p = new Populate();
p.populateDataset()
    .then(data => console.log(data))
    .catch(err => console.log(err));
