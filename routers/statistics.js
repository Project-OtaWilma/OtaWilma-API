const express = require('express');
const router = express.Router();
const { schemas, validators } = require('./validator');
const { public } = require('../database/public-api');
const { planned } = require('../database/plan-api');
const authentication = require('../database/authentication');

const limiter = require('./rate-limit');
const { statistics }= require('../database/statistics');

router.get('/statistics/users', limiter.create, async (req, res) => {
    const auth = await authentication.validateToken(req, res);
    if (!auth) return;
    

    statistics.getTotalUsers()
    .then(data => {
        return res.json(data);
    })
    .catch(err => {
        return res.status(err.status ?? 500).json(err);
    })
    
});





module.exports = router;