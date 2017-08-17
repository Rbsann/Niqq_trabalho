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

router.get('/fractionedSignup', function(req, res, next){// stats do frac sign up
    Stats.fractionedSignup().then((contagem) => {
        var chart = {
            type: 'bar',
            data:{
                    labels: ["p.View", "S. Step1", "S. Step2","Download","not download"],
                    datasets: [{
                        data: [contagem['pageView'], contagem['endSignupStep1'], contagem['endSignupStep2'],contagem['signupCompletedWithDownload'],contagem['signupCompletedWithoutDownload']]
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

router.get('/formsCompared', function(req, res, next){ // stats de download/install e tempo para unistall
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

router.get('/fill', function(req, res, next){
    Stats.fill()
        .then((time) => {
            res.status(200).json(time);
        })
        .catch((error) => {
            console.log(error);
            res.status(500).end();
        });
});

module.exports = router;