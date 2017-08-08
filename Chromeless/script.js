const { Chromeless } = require('chromeless');
const fs = require("fs");

async function run(url, form) {
  const chromeless = new Chromeless({
    remote: {
      endpointUrl: 'https://3pw6tmr8d3.execute-api.us-east-1.amazonaws.com/dev/',
      apiKey: 'zK6yJfLD7i6qbMCtNvR1u7l1Y0hnPdVM8IIByHBz'
    },
  });
  
  chromeless.queue.chrome.options.viewport = {width: 1024, height: 2000, scale: 1};
  chromeless.queue.chrome.options.launchChrome = false;
  // console.log(chromeless.queue.chrome.options);

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

  // Salvar localmente:
  // fs.createReadStream(screenshot).pipe(fs.createWriteStream(path+domain+".txt"));

  let file = fs.createWriteStream(path+domain+".txt");
  file.write(screenshot);
  file.write(html);
  file.end();

  // Salvar no S3
  // console.log(screenshot); // prints local file path or S3 url
  // console.log(html);

  await chromeless.end();
}

run("https://carrinho.ricardoeletro.com.br/Cliente/Cadastro", true).catch(console.error.bind(console));

// async function runForm () {
//   if (forms.length > 0) {
//     let url = forms.pop();

//     run(url, true)
//       .then(_ => {
//         runForm();
//       })
//       .catch(console.error.bind(console));
//   }
// }

// var runNotForm = async function () {
//   if (notforms.length > 0) {
//     let url = notforms.pop();

//     run(url, false)
//       .then(_ => {
//         runNotForm();
//       })
//       .catch(console.error.bind(console));
//   }
// }

// runForm();
// runNotForm();