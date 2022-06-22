const express = require('express');
const router = express.Router();
const { schemas, validators } = require('./validator');
const { createConfig, getConfig } = require('../filesystem/file-manager');

router.get('/sessions/create', (req, res) => {
    createConfig()
    .then(hash => {
        return res.json({session: hash});
    })
    .catch(err => {
        return res.status(err.error).json(err);
    })
});

router.get('/sessions/get/:hash', (req, res) => {
    const request = validators.validateRequestParameters(req, res, schemas.configGet);

    if(!request) return;

    getConfig(request.hash)
    .then(config => {
        return res.json(config);
    })
    .catch(err => {
        return res.status(err.error).json(err);
    })
});



module.exports = router;