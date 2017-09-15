const Populate = require('./populate.js');

let populate = new Populate();
populate.populateDataset()
    .then(sucesso => {
        if(result === true)
            console.log("Operação finalizada com sucesso!");
    })
    .catch(err => console.log(err));