'use-strict';

const env = process.argv[2] || 'dev';
let gcs;

if(env === 'dev'){
    gcs = require('@google-cloud/storage')({
        projectId: 'sophia-179715',
        keyFilename: './Sophia-01b9b48e4c11.json'
    });
}else{
    gcs = require('@google-cloud/storage')();
}

/*
    Classe que abstrai a manipulação da Google Cloud Storage. Pronta para ser usada 
    na nuvem ou localmente.
*/
class Storage{
    constructor(bucketName = 'niqq-form-screenshots'){
        this.bucket = gcs.bucket(bucketName);
        this.baseFileUrl = `http://storage.googleapis.com/${bucketName}/`;
    }

    // path de um arquivo no disco
    uploadFile(path){
        let self = this;
        return new Promise((resolve, reject) => {
            self.bucket.upload(path, { public: true })
                .then(file => {
                    let url = self.baseFileUrl + file.name;
                    resolve(url);
                })
                .catch(error => reject(error));
        });
    }
}

module.exports = Storage;