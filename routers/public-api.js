const express = require('express');
const router = express.Router();
const { schemas, validators } = require('./validator');
const { public } = require('../database/public-api');
const authentication = require('../database/authentication');

const limiter = require('./rate-limit');

router.post('/public-api/publish', limiter.create, async (req, res) => {
    const auth = await authentication.validateToken(req, res);
    if (!auth) return;
    

    public.publish(auth)
        .then(result => {
            return res.json(result);
        })
        .catch(err => {
            console.log(err);
            return res.status(err.status).json(err);
        })
    
});




module.exports = router;