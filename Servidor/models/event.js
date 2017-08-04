const mongoose = require('mongoose');
const User = require('./user.js');

mongoose.Promise = global.Promise;

var eventSchema = new mongoose.Schema({
    userId: { type: String},
    timestamp: {type: Date, required: true},
    eventCategory: {type: String, required: true},
    eventAction: {type: String, required: true}
});

eventSchema.methods.store = function(){
    return new Promise((resolve, reject) => {

        if(!this.eventCategory || !this.eventAction)
            reject("INVALID_EVENT");
        
        this.timestamp = Date.now();
        this.save()
            .then(() => resolve())
            .catch(err => reject(err));
    });
    
};

function listAll(){
    return new Promise((resolve, reject) => {
        this.find({})
            .then(events => resolve(events))
            .catch(error => reject(error));
    });
}

function search(params){
    return new Promise((resolve, reject) => {
        this.find(params)
            .then(events => resolve(events))
            .catch(error => reject(error));
    });
}

module.exports = mongoose.model('event', eventSchema);
module.exports.listAll = listAll;
module.exports.search = search;
