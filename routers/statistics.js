const express = require('express');
const router = express.Router();
const { schemas, validators } = require('./validator');
const { public } = require('../database/public-api');
const { planned } = require('../database/plan-api');
const authentication = require('../database/authentication');

const limiter = require('./rate-limit');
const { statistics }= require('../database/statistics');

router.get('/api/statistics/users', limiter.create, async (req, res) => {

    statistics.getTotalUsers()
    .then(data => {
        return res.json(data);
    })
    .catch(err => {
        return res.status(err.status ?? 500).json(err);
    })
    
});

router.get('/metrics', limiter.create, async (req, res) => {

    statistics.resolveWilmaResponsetime()
    .then(data => {
        return res.setHeader('Content-Type', 'text/plain; version=0.0.4; charset=utf-8').send(`
# HELP wilma_response_time_ms Wilma's current response time
# TYPE wilma_response_time_ms gauge
wilma_response_time_ms ${data}
        `)
    })
    .catch(err => {
        return res.status(err.status ?? 500).json(err);
    })
    
});




module.exports = router;