const weights = require('./weights.json');

/*
    Uso:
        let classifier = new Classifier();
        classifier.isForm(<array_de_features>)
            .then(classification => {})
*/
class Classifier{
    constructor(threshold = 0.5){
        this.weights = weights;
        this.threshold = threshold;
    }

    isForm(features){
        let self = this;
        return new Promise((resolve,reject) => {
            let expression = self.getExpression(features);
            let e = Math.exp(expression);
            let classification = e / (1 + e);
            // console.log(expression);
            // return resolve(classification >= self.threshold);
            resolve(classification);
        });
    }

    getExpression(features){
        let result = 0;
        //TODO: Remover log de debug
        // if(Object.keys(features).length === Object.keys(this.weights))
        //     console.log("ERROR");

        Object.keys(features).forEach(function(key){
                result += features[key] * this.weights[key];
            }, this);

        return result;
    }
}

module.exports = Classifier;