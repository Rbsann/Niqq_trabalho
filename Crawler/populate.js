'use-strict';

const Downloader = require('./downloader.js');
const NinderClient = require('./ninderClient.js');

var timeoutPromise = function(durationMs) {
    return new Promise((resolve, reject) => {
        setTimeout(_ => reject(Error("ERR_POPULATE_TIMEOUT")), durationMs);      
    });
};

class Populate {
    constructor() {
        let self = this;
        self.client = new NinderClient();
        self.downloader = new Downloader();
    }

    tratar(url){
        if(url.indexOf('http://') < 0 && url.indexOf('https://') < 0)
            return 'http://' + url;
            // return (url.indexOf('www') < 0 ? 'http://www.' + url : 'http://' + url);
        return url;
    }

    /*
        Popula o servidor com dados passíveis de classificação manual.
    */
    populateDataset() {
        const self = this;
        let populatePromise = new Promise((resolve, reject) => {
            console.log("\nPopulate: getting next url");
            let url = "";
            self.downloader.initialize()
                .then(_ => self.client.getNextUrlToDownloadHtml())
                .then(response => {
                    url = response.url;
                    return self.downloader.getDataFrom(self.tratar(url));
                })
                .then(data => Promise.all([
                        self.client.sendScreenshot(url, data.screenshot),
                        self.client.sendHtml(url, data.html)
                    ]))
                .then(_ => {
                    console.log("Populate: completed with success URL", url);
                    resolve(true);
                })
                .catch(error => {
                    console.log("Populate: failed with error");
                    reject(error);
                });
        });
        
        return Promise.race([populatePromise, timeoutPromise(30000)]);
    }
}

module.exports = Populate;