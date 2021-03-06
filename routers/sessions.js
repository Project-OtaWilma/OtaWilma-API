const express = require('express');
const router = express.Router();
const { schemas, validators } = require('./validator');
const { config } = require('../MongoDB/database');

const limiter = require('./rate-limit');

router.post('/sessions/config/login', (req, res) => {
    const request = validators.validateRequestBody(req, res, schemas.configLogin);

    if (!request) return

    config.login(request.hash, request.username)
        .then(hash => {
            return res.json({ session: hash });
        })
        .catch(err => {
            return res.status(err.status).json(err);
        })
});

router.post('/sessions/config/create', limiter.strict, (req, res) => {
    const request = validators.validateRequestBody(req, res, schemas.configCreate);

    if (!request) return

    config.createConfig(request.username)
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

router.get('/sessions/config/login-history/get/:hash', (req, res) => {
    const request = validators.validateRequestParameters(req, res, schemas.configGet);

    if (!request) return;

    config.getLoginHistory(request.hash)
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