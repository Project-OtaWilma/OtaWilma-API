const express = require('express');
const router = express.Router();
const { schemas, validators } = require('./validator');
const { createTheme, getTheme } = require('../filesystem/file-manager');

router.get('/themes/create/:hash', (req, res) => {
    const request = validators.validateRequestParameters(req, res, schemas.configGet);
    
    if(!request) return;

    createTheme()
    .then(hash => {
        return res.json({session: hash});
    })
    .catch(err => {
        return res.status(err.error).json(err);
    })
});

router.get('/themes/get/:hash/:id', (req, res) => {
    const request = validators.validateRequestParameters(req, res, schemas.themeGet);
    
    if(!request) return;

    getTheme(request.hash, request.id)
    .then(config => {
        return res.json(config);
    })
    .catch(err => {
        return res.status(err.error).json(err);
    })
});

module.exports = router;