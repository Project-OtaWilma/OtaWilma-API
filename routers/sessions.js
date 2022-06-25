const express = require('express');
const router = express.Router();
const { schemas, validators } = require('./validator');
const { createConfig, getConfig, editConfigFrontpage, setConfigTheme } = require('../filesystem/file-manager');

router.post('/sessions/config/create', (req, res) => {
    createConfig()
        .then(hash => {
            return res.json({ session: hash });
        })
        .catch(err => {
            return res.status(err.error).json(err);
        })
});


router.get('/sessions/config/get/:hash', (req, res) => {
    const request = validators.validateRequestParameters(req, res, schemas.configGet);

    if (!request) return;

    getConfig(request.hash)
        .then(config => {
            return res.json(config);
        })
        .catch(err => {
            return res.status(err.error).json(err);
        })
});

router.post('/sessions/config/frontpage/edit/:hash', (req, res) => {
    const params = validators.validateRequestParameters(req, res, schemas.configGet);
    if (!params) return;

    const body = validators.validateRequestBody(req, res, schemas.configEditBody);
    if (!body) return;

    editConfigFrontpage(params.hash, { key: body.key, value: body.value })
        .then(status => {
            return res.json(status);
        })
        .catch(err => {
            return res.status(err.error).json(err);
        })
});

router.post('/sessions/config/current-theme/set/:hash', (req, res) => {
    const params = validators.validateRequestParameters(req, res, schemas.configGet);
    if (!params) return;

    const body = validators.validateRequestBody(req, res, schemas.configSetBody);
    if (!body) return;

    setConfigTheme(params.hash, body.theme)
        .then(config => {
            return res.json(config);
        })
        .catch(err => {
            return res.status(err.error).json(err);
        })
});


module.exports = router;