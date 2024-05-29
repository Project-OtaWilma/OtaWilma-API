const express = require('express');
const router = express.Router();
const { schemas, validators } = require('./validator');
const { config } = require('../database/user-schema');
const authentication = require('../database/authentication');

const limiter = require('./rate-limit');

// login

router.post('/login', async (req, res) => {
    const auth = await authentication.validateToken(req, res);
    if (!auth) return;

    config.login(auth)
        .then(hash => {
            return res.json({ session: hash });
        })
        .catch(err => {
            return res.status(err.status ?? 500).json(err);
        })
});

router.get('/config/', async (req, res) => {
    const auth = await authentication.validateToken(req, res);
    if (!auth) return;

    config.getConfig(auth)
        .then(config => {
            return res.json(config);
        })
        .catch(err => {
            return res.status(err.status ?? 500).json(err);
        })
});

router.get('/config/login-history/', async (req, res) => {
    const request = validators.validateRequestParameters(req, res, schemas.configGet);
    if (!request) return;

    const auth = await authentication.validateToken(req, res);
    if (!auth) return;

    config.getLoginHistory(auth)
        .then(config => {
            return res.json(config);
        })
        .catch(err => {
            return res.status(err.status ?? 500).json(err);
        })
});

router.post('/config/set/current-theme/',async (req, res) => {
    const body = validators.validateRequestBody(req, res, schemas.configSetBody);
    if (!body) return;

    const auth = await authentication.validateToken(req, res);
    if (!auth) return;

    config.setTheme(auth, body.theme)
        .then(config => {
            return res.json(config);
        })
        .catch(err => {
            return res.status(err.status ?? 500).json(err);
        })
});


module.exports = router;