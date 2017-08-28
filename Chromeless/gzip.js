const zlib = require('zlib');

module.exports.zip = function(text) {
  return new Promise((resolve, reject) => {
    zlib.deflate(text, (error, zippedText) => {
      if (!error) {
        resolve(zippedText.toString('base64'));
      } else {
        reject(error);
      }
    });
  });
};


module.exports.unzip = function(zippedText) {
  return new Promise((resolve, reject) => {
    const buffer = Buffer.from(zippedText, 'base64');

    zlib.unzip(buffer, (error, unzippedText) => {
      if (!error) {
        resolve(unzippedText.toString());
      } else {
        reject(error);
      }
    });
  });
};