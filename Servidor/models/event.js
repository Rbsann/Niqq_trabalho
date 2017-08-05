const mongoose = require('mongoose');
const User = require('./user.js');

mongoose.Promise = global.Promise;

var eventSchema = new mongoose.Schema({
    userId: { type: String},
    timestamp: {type: Date, required: true},
    eventCategory: {type: String, required: true},
    eventAction: {type: String, required: true}
});

eventSchema.methods.store = function(user){
    return new Promise((resolve, reject) => {

        if(!this.eventCategory || !this.eventAction)
            reject("INVALID_EVENT");
        
        if(user)
            this.userId = user._id;
        
        this.timestamp = Date.now();
        this.save()
            .then(() => resolve())
            .catch(err => reject(err));
    });
    
};

function search(params){
    return new Promise((resolve, reject) => {
        this.find(params)
            .then(events => resolve(events))
            .catch(error => reject(error));
    });
}

module.exports = mongoose.model('event', eventSchema);
module.exports.search = search;
