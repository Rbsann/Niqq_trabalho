var mongoose = require('mongoose');
var Schema = mongoose.Schema;

mongoose.Promise = global.Promise;

var pageSchema = new Schema({
	url: { type: String, required: true, unique: true, maxlength: 200 },
	imageUrl: { type: String, default: null, maxlength: 100 },
  isForm: { type: Boolean},
  classified: { type: Boolean, default: false },
  html: { type: String, default: null, maxlength: 500000 }
});

// Export catalog model
module.exports = mongoose.model('Page', pageSchema);

/// Exported functions
module.exports.updateImageUrl = function(url, imageUrl) {
  return new Promise((resolve, reject) => {
    this.findOne({url: url})
      .then(page => {
        page.imageUrl = imageUrl;
        page.save()
          .then(_ => {
            resolve(true);
          })
          .catch(error => { 
            reject(error);
          });
      })
      .catch(error => { 
        reject(error);
      });
  });
};

module.exports.updateHtml = function(url, html) {
  return new Promise((resolve, reject) => {
    this.findOne({url: url})
      .then(page => {
        page.html = html;
        page.save()
          .then(_ => {
            resolve(true);
          })
          .catch(error => { 
            reject(error);
          });
      })
      .catch(error => { 
        reject(error);
      });
  });
};

module.exports.classify = function(url, isForm) {
  return new Promise((resolve, reject) => {
    this.findOne({url: url})
      .then(page => {
        page.isForm = isForm;
        page.classified = true;
        page.save()
          .then(_ => {
            resolve(true);
          })
          .catch(error => { 
            reject(error);
          });
      })
      .catch(error => { 
        reject(error);
      });
  });
};

module.exports.insert = function(url) {
  return new Promise((resolve, reject) => {
    var page = new module.exports();
    page.url = url;
    page.save()
      .then(() => {
        resolve(true);
      })
      .catch((error) => { 
        if (error.message.indexOf("duplicate key") !== -1) {
          resolve(true);
        }
        reject(error);
      });
  });
};

module.exports.getPageToClassify = function() {
  return new Promise((resolve, reject) => {
    // Get the count of all users
    this.find({classified: false}).where('imageUrl').ne(null).count()
      .then(count => {
        // console.log("Number of found entries: "+ count);
        // Get a random entry
        var random = Math.floor(Math.random() * count);
        // console.log("Getting document #"+random);
        // Again query all users but only fetch one offset by our random #
        this.findOne({classified: false}).where('imageUrl').ne(null).skip(random)
          .then(result => {
            // console.log(result);
            resolve(result);
          })
          .catch(error => {
            reject(error);
          });
      })
      .catch(error => {
        reject(error);
      });
  });
};


module.exports.getPageToScreenshot = function(){
  return new Promise((resolve, reject) => {
    // Get the count of all users
    this.find({classified: false, imageUrl: null}).count()
      .then(count => {
        // console.log("Number of found entries: "+ count);
        // Get a random entry
        var random = Math.floor(Math.random() * count);
        // console.log("Getting document #"+random);
        // Again query all users but only fetch one offset by our random #
        this.findOne({classified: false, imageUrl: null}).skip(random)
          .then(result => {
            // console.log(result);
            resolve(result);
          })
          .catch(error => {
            reject(error);
          });
      })
      .catch(error => {
        reject(error);
      });
  });
};


module.exports.getPageToHtml = function(){
  return new Promise((resolve, reject) => {
    // Get the count of all users
    this.find({html: null}).count()
      .then(count => {
        // console.log("Number of found entries: "+ count);
        // Get a random entry
        var random = Math.floor(Math.random() * count);
        // console.log("Getting document #"+random);
        // Again query all users but only fetch one offset by our random #
        this.findOne({html: null}).skip(random)
          .then(result => {
            // console.log(result);
            resolve(result);
          })
          .catch(error => {
            reject(error);
          });
      })
      .catch(error => {
        reject(error);
      });
  });
};


