const Chromeless = require('chromeless').default;


var remoteOptions = {
    remote: {
      endpointUrl: 'https://qvyi8j05ma.execute-api.us-east-2.amazonaws.com/dev/',
      apiKey: '6b77VIfmIi9UZupDLZBM79YVBuGe7muxwHS2NRO8'
    },
  };

///
/// Entra no site especificado, pega html e retorna uma Promise que resolve o Html
///
async function getHtml(url) {
  const chromeless = new Chromeless(remoteOptions);

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
  const chromeless = new Chromeless(remoteOptions);

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


///
/// Chromeless LOCAL entra no Google e retorna json de resultados equivalente ao numero de paginas especificado
///
async function googleQuery(url, numberOfPages) {
  const chromeless = new Chromeless();
  console.log("Going to google");

  await chromeless
    .goto(url);

  var results = [];
  // while (numberOfPages > 0) {
    console.log("Page #"+1);

    var partialResults = await chromeless
      .wait('#resultStats')
      .evaluate(() => {
        // this will be executed in headless chrome
        const links = [].map.call(
          document.querySelectorAll('.g h3 a'),
          a => (a.href.split("https://www.google.com.br/url?q=")[1].split("&sa=")[0])
        );
        // console.log(links);
        return links;
      });

      await chromeless.click("#pnnext");
      console.log("clicked next page");
      results.concat(partialResults);
      numberOfPages--;

      var partialResults2 = await chromeless
      .wait('#resultStats')
      .evaluate(() => {
        // this will be executed in headless chrome
        const links = [].map.call(
          document.querySelectorAll('.g h3 a'),
          a => (a.href.split("https://www.google.com.br/url?q=")[1].split("&sa=")[0])
        );
        // console.log(links);
        return links;
      });

      await chromeless.click("#pnnext");
      console.log("clicked next page");
      results.concat(partialResults2);
      numberOfPages--;
  // }

  await chromeless.end();
  return new Promise((resolve, reject) => {
    resolve(results);
  });
}



module.exports.getHtml = function(url){
  return Promise.race([getHtml(url),timeout(15000)]);
};

module.exports.getScreenshot = function(url){
  return Promise.race([getScreenshot(url),timeout(15000)]);
};

module.exports.googleQuery = function(query){
  return Promise.race([googleQuery(query),timeout(20000)]);
};

var timeout = function(time) {
  return new Promise(function(resolve, reject) { 
    setTimeout(reject, time, 'timeout'); 
  });
};