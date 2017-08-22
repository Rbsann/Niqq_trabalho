const Chromeless = require('chromeless').default;

///
/// Entra no site especificado, pega html e retorna uma Promise que resolve o Html
///
async function getHtml(url) {
  const chromeless = new Chromeless({
    remote: {
      endpointUrl: 'https://qvyi8j05ma.execute-api.us-east-2.amazonaws.com/dev/',
      apiKey: '6b77VIfmIi9UZupDLZBM79YVBuGe7muxwHS2NRO8'
    },
  });

  chromeless.queue.chrome.options.viewport = {width: 1440, height: 2000, scale: 1};
  chromeless.queue.chrome.options.launchChrome = false;

  console.log("Going to: "+ url);
  const html = await chromeless
    .goto(url)
    .html();

  console.log("End of: "+ url);

  await chromeless.end();
  return new Promise((resolve, reject) => {
    resolve(html);
  });
}

///
/// Entra no site especificado, pega screenshot e retorna uma Promise que resolve o link do S3 do screnshot
///
async function getScreenshot(url) {
  const chromeless = new Chromeless({
    remote: {
      endpointUrl: 'https://qvyi8j05ma.execute-api.us-east-2.amazonaws.com/dev/',
      apiKey: '6b77VIfmIi9UZupDLZBM79YVBuGe7muxwHS2NRO8'
    },
  });

  chromeless.queue.chrome.options.viewport = {width: 1440, height: 2000, scale: 1};
  chromeless.queue.chrome.options.launchChrome = false;

  console.log("Going to: "+ url);
  const screenshot = await chromeless
    .goto(url)
    .wait(4000)
    .screenshot();

  console.log("End of: "+ url);

  await chromeless.end();
  return new Promise((resolve, reject) => {
    resolve(screenshot);
  });
}


module.exports.getHtml = function(url){
  return Promise.race([getHtml(url),timeout(8000)]);
};

module.exports.getScreenshot = function(url){
  return Promise.race([getScreenshot(url),timeout(15000)]);
};

var timeout = function(time) {
  return new Promise(function(resolve, reject) { 
    setTimeout(reject, time, 'timeout'); 
  });
};