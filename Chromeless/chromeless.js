const Chromeless = require('chromeless').default;
const fs = require("fs");

///
/// Entra no site especificado, tira screenshot e pega html. Salva screenshot no S3, coloca o link no arquivo <url>.txt e coloca o html em seguida
///
async function runProxy(url, form) {
  const chromeless = new Chromeless({
    remote: {
      endpointUrl: 'https://3pw6tmr8d3.execute-api.us-east-1.amazonaws.com/dev/',
      apiKey: 'zK6yJfLD7i6qbMCtNvR1u7l1Y0hnPdVM8IIByHBz'
    },
  });
  
  setTimeout(_ => {
    chromeless.end();
  }, 30000); // Seta timeout da funcao
  chromeless.queue.chrome.options.viewport = {width: 1280, height: 2000, scale: 1};
  chromeless.queue.chrome.options.launchChrome = false;

  console.log("Going to: "+ url);
  const html = await chromeless
    .goto(url)
    .html();

  const screenshot = await chromeless
    .goto(url)
    .wait(5000)
    .screenshot();

  var domain = url.split("/")[2];

  var path = "./outputs/";
  if (form)
    path += "form/";
  else
    path += "notform/";

  let file = fs.createWriteStream(path+domain+".html");
  file.write(html);
  file.end();

  let file = fs.createWriteStream("image-"+path+domain+".txt");
  file.write(screenshot);
  file.end();

  console.log("End of: "+ url);
  await chromeless.end();
}

// Função quase igual, em desacordo com DRY, porém tem que ficar mudando o remote toda hora, sendo melhor deixar por enquanto essa função intacta.
async function runLocal(url, form) {
  const chromeless = new Chromeless();
  
  setTimeout(_ => {
    chromeless.end();
  }, 30000); // Seta timeout da funcao
  chromeless.queue.chrome.options.viewport = {width: 1280, height: 2000, scale: 1};
  chromeless.queue.chrome.options.launchChrome = false;

  console.log("Going to: "+ url);
  const html = await chromeless
    .goto(url)
    .html();

  // const screenshot = await chromeless
  //   .goto(url)
  //   .wait(5000)
  //   .screenshot();

  var domain = url.split("/")[2];

  var path = "./outputs/";
  if (form)
    path += "form/";
  else
    path += "notform/";

  let file = fs.createWriteStream(path+domain+".html");
  file.write(html);
  file.end();

  // fs.createReadStream(screenshot).pipe(fs.createWriteStream(path+domain+".png"));

  console.log("End of: "+ url);
  await chromeless.end();
}

module.exports.run = function(url, form, remote = false){
  if(remote)
    runProxy(url, form).catch(console.error.bind(console));
  else
    runLocal(url, form).catch(console.error.bind(console));
};
