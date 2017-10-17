'use-strict';

const Downloader = require('./downloader.js');
const NinderClient = require('./ninderClient.js');

const timeoutPromise = function(durationMs) {
    return new Promise((resolve, reject) => {
        setTimeout(_ => reject(Error("ERR_POPULATE_TIMEOUT")), durationMs);      
    });
};

const ninderClient = new NinderClient();

class Populate {
    constructor(idNumber) {
        let self = this;
        
        self.downloader = new Downloader(idNumber);
        self.idNumber = idNumber;
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
            console.log(`\Populate ${self.idNumber}: getting next url`);
            let url = "";
            self.downloader.initialize()
                .then(_ => ninderClient.getNextUrlToDownloadHtml())
                .then(response => {
                    url = response.url;
                    return self.downloader.getDataFrom(self.tratar(url));
                })
                .then(data => Promise.all([
                    ninderClient.sendScreenshot(url, data.screenshot),
                    ninderClient.sendHtml(url, data.html)
                ]))
                .then(_ => {
                    console.log(`Populate ${self.idNumber}: completed with success URL`, url);
                    resolve(true);
                })
                .catch(error => {
                    console.log(`Populate ${self.idNumber}: failed with error`);
                    reject(error);
                });
        });
        
        return Promise.race([populatePromise, timeoutPromise(30000)]);
    }
}

module.exports = Populate;