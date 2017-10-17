'use-strict';

const Populate = require('./populate.js');
const fs = require('fs-extra');
const imagesDir = __dirname + '/images';

// Cria o diretório para salvar as imagens antes de fazer o upload para a storage
function handleDirectories(){
    return new Promise((resolve, reject) => {
        fs.remove(imagesDir)
          .then(() => fs.mkdir(imagesDir))
          .then(() => resolve(true))
          .catch(err => reject(err));
    });
}

let populate = new Populate();

function run(){
    populate.populateDataset()
        .then(_ => run())
        .catch(err => {
            console.log(err);
            run();
        });
}

handleDirectories()
    .then(() => run())
    .catch(err => console.log(err));