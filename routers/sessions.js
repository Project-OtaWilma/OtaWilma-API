const express = require('express');
const router = express.Router();
const { schemas, validators } = require('./validator');
const { setConfigTheme } = require('../filesystem/file-manager');
const { config } = require('../MongoDB/database');

router.post('/sessions/config/create', (req, res) => {
    config.createConfig()
        .then(hash => {
            return res.json({ session: hash });
        })
        .catch(err => {
            return res.status(err.status).json(err);
        })
});


router.get('/sessions/config/get/:hash', (req, res) => {
    const request = validators.validateRequestParameters(req, res, schemas.configGet);

    if (!request) return;

    config.getConfig(request.hash)
        .then(config => {
            return res.json(config);
        })
        .catch(err => {
            return res.status(err.status).json(err);
        })
});

router.post('/sessions/config/current-theme/set/:hash', (req, res) => {
    const params = validators.validateRequestParameters(req, res, schemas.configGet);
    if (!params) return;

    const body = validators.validateRequestBody(req, res, schemas.configSetBody);
    if (!body) return;

    config.setTheme(params.hash, body.theme)
        .then(config => {
            return res.json(config);
        })
        .catch(err => {
            return res.status(err.status).json(err);
        })
});


module.exports = router;