const router = require('express').Router();
const Stats = require('../models/stats.js');
/*
    Autenticação nesta API é opcional!
*/

router.get('/test', (req, res) => {
    Stats.formsCompared()
        .then(counts => console.log(counts))
        .catch(error => console.log(error));
    Stats.fill()
        .then(dataTot => console.log(dataTot))
        .catch(error => console.log(error));
    res.send('ok');
});

// Quando a api receber uma requisição de verbo POST, 
// router.get('/', function (req, res, next){ //cria pagina para visualizar stats
//     res.render('stats');
// });

//router.get('/botSignup', function(req, res, next){ //clicavel, on-click mostra stats do fill up do bot
 //   var contagem = Stats.botSignUpPage();
 //   var data = [
  //      {
   //         x: ["Ended", "Downloaded", "Not Downloaded"],
    //        y: contagem,
   //         type: "bar"
  //      }
  //  ];
   // res.json(data);
   // var graphOptions = { filename: "basic-bar", fileopt: "overwrite" };
  //  plotly.plot(data, graphOptions, function (err, msg) {
        //console.log(msg);
    //});
//});

//router.get('/fracSignup', function(req, res, next){// stats do form
  //  var contagem = Stats.formSignUp();
   // var data = [
     //   {
       //     x: ["pView", "step1", "step2", "down", "notDown"],
         //   y: contagem,
          //  type: "bar"
       // }
   // ];
   // res.json(data);
//});


router.get('/fracSignup', function(req, res, next){// stats do frac sign up
    Stats.fracSignup().then((contagem) => {
        var chart = {
            type: 'bar',
            data:{
                    labels: ["pageView", "endSignupStep1", "endSignupStep2","signupCompletedWithDownload","signupCompletedWithoutDownload"],
                    datasets: [{
                        data: [contagem['pageView'], contagem['endSignupStep1'], contagem['endSignupStep2'],contagem['signupCompletedWithDownload'],contagem['signupCompletedWithoutDownload']]
                    }]
                }
            };
        res.status(200).json(chart);
        // res.redirect(req.originalUrl + ':8123/graphs');
    })
    .catch((err) => {
        console.log(err);
        res.status(500).end();
    });
});

router.get('/formsCompared', function(req, res, next){ // stats de download/install e tempo para unistall
    console.log("cheguei aqui!");
    Stats.formsCompared().then((contagem) => {
        var chart = {
            type: 'bar',
            data:{
                    labels: ["SignupFormPage", "SignupFrac", "Install"],
                    datasets: [{
                        data: [contagem['SignupFormPage'], contagem['FractionedSignupPage'], contagem['Install']]
                    }]
                }
            };
        res.status(200).json(chart);
    })
    .catch((err) => {
        console.log(err);
        res.status(500).end();
    });
});

router.get('/fill', function(req, res, next){// fill e histograma de tempo de fill.data-download.data
    Stats.fill()
        .then((time) => {
            res.status(200).json(time);
        })
        .catch((error) => {
            console.log(error);
        });
});

module.exports = router;