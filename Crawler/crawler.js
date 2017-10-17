'use-strict';

const Populate = require('./populate.js');
const fs = require('fs-extra');
const imagesDir = __dirname + '/images';

let numberOfInstances = parseInt(process.argv[2]) || 1;

// Cria o diretório para salvar as imagens antes de fazer o upload para a storage
function handleDirectories(){
    return new Promise((resolve, reject) => {
        fs.remove(imagesDir)
          .then(() => fs.mkdir(imagesDir))
          .then(() => resolve(true))
          .catch(err => reject(err));
    });
}

function run(populate){
    populate.populateDataset()
        .then(_ => run(populate))
        .catch(err => {
            console.log(err);
            run(populate);
        });
}

handleDirectories()
    .then(_ => {
        console.log("---------------------------------------");
        console.log(`Crawler: starting with ${numberOfInstances} instances`);
        console.log("---------------------------------------\n");
        while (numberOfInstances-- > 0) {
            run(new Populate(numberOfInstances + 1));
        }
    })
    .catch(err => console.log(err));