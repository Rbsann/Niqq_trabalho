const router = require('express').Router();
const Stats = require('../models/stats.js');
const plotly = require('plotly')("DemoAccount", "lr1c37zw81"); // Preencher com dados corretos depois
/*
    Autenticação nesta API é opcional!
*/

router.get('/test', (req, res) => {
    Stats.extension()
        .then(counts => console.log(counts))
        .catch(error => console.log(error));
    Stats.fill()
        .then(dataTot => console.log(dataTot))
        .catch(error => console.log(error));
    res.send('ok');
});

// Quando a api receber uma requisição de verbo POST, 
router.get('/', function (req, res, next){ //cria pagina para visualizar stats
    res.render('stats');
});

router.get('/botSignup', function(req, res, next){ //clicavel, on-click mostra stats do fill up do bot
    var contagem = Stats.botSignUpPage();
    var data = [
        {
            x: ["Ended", "Downloaded", "Not Downloaded"],
            y: contagem,
            type: "bar"
        }
    ];
    res.json(data);
    var graphOptions = { filename: "basic-bar", fileopt: "overwrite" };
    plotly.plot(data, graphOptions, function (err, msg) {
        //console.log(msg);
    });
});

router.get('/formSignup', function(req, res, next){// stats do form
    var contagem = Stats.formSignUp();
    var data = [
        {
            x: ["pView", "step1", "step2", "down", "notDown"],
            y: contagem,
            type: "bar"
        }
    ];
    res.json(data);
});

router.get('/extension', function(req, res, next){// stats de download/install e tempo para unistall
    var contagem = Stats.extension();
    var data = [
            {
                x: ["downBot", "downForm", "install"],
                y: contagem,
                type: "bar"
            }
        ];
    res.json(data);
    var graphOptions = { filename: "basic-bar", fileopt: "overwrite" };
});

router.get('/fill', function(req, res, next){// fill e histograma de tempo de fill.data-download.data
    var tempo = Stats.fill();
    var data = [
        {
            x: tempo,
            type: "histogram"
        }
    ];
    var graphOptions = { filename: "basic-histogram", fileopt: "overwrite" };
    plotly.plot(data, graphOptions, function (err, msg) {
        //console.log(msg);
    });
});

module.exports = router;