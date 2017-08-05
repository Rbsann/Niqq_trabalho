const { Chromeless } = require('chromeless');
const fs = require("fs");
const forms = require("./forms.json");
const notforms = require("./notforms.json");

async function run(url, form) {
  const chromeless = new Chromeless();
  
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

  fs.createReadStream(screenshot).pipe(fs.createWriteStream(path+domain+".png"));

  let streamHtml = fs.createWriteStream(path+domain+".txt");
  streamHtml.write(html);
  streamHtml.end();

  await chromeless.end();
}

async function runForm () {
  if (forms.length > 0) {
    let url = forms.pop();

    run(url, true)
      .then(_ => {
        runForm();
      })
      .catch(console.error.bind(console));
  }
}

var runNotForm = async function () {
  if (notforms.length > 0) {
    let url = notforms.pop();

    run(url, false)
      .then(_ => {
        runNotForm();
      })
      .catch(console.error.bind(console));
  }
}

runForm();
runNotForm();