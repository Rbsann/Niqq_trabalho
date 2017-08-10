const { Chromeless } = require('chromeless');
const fs = require("fs");

///
/// Entra no site especificado, tira screenshot e pega html. Salva screenshot no S3, coloca o link no arquivo <url>.txt e coloca o html em seguida
///
async function run(url, form) {
  const chromeless = new Chromeless({
    remote: {
      endpointUrl: 'https://3pw6tmr8d3.execute-api.us-east-1.amazonaws.com/dev/',
      apiKey: 'zK6yJfLD7i6qbMCtNvR1u7l1Y0hnPdVM8IIByHBz'
    },
  });
  
  chromeless.queue.chrome.options.viewport = {width: 1024, height: 2000, scale: 1};
  chromeless.queue.chrome.options.launchChrome = false;

  console.log("Going to: "+ url);
  const html = await chromeless
    .goto(url)
    .html();

  const screenshot = await chromeless
    .goto(url)
    .wait(3000)
    .screenshot();

  var domain = url.split("/")[2];

  var path = "./outputs/";
  if (form)
    path += "form/";
  else
    path += "notform/";

  let file = fs.createWriteStream(path+domain+".txt");
  file.write(screenshot);
  file.write(html);
  file.end();

  console.log("End of: "+ url);
  await chromeless.end();
}

module.exports.run = function(url, form){
  run(url, form).catch(console.error.bind(console));
  // run("http://google.com/", false).catch(console.error.bind(console));
};
