const express = require('express');
const router = express.Router();
const { schemas, validators } = require('./validator');
const { createTheme, getTheme, listThemes, editTheme } = require('../filesystem/file-manager');
const { route } = require('./sessions');

router.post('/themes/create/:hash', (req, res) => {
    const request = validators.validateRequestParameters(req, res, schemas.configGet);

    if (!request) return;

    createTheme(request.hash)
        .then(hash => {
            return res.json({ session: hash });
        })
        .catch(err => {
            return res.status(err.status).json(err);
        })
});

router.get('/themes/get/:hash/:id', (req, res) => {
    const request = validators.validateRequestParameters(req, res, schemas.themeGet);

    if (!request) return;

    getTheme(request.hash, request.id)
        .then(config => {
            return res.json(config);
        })
        .catch(err => {
            return res.status(err.status).json(err);
        })
});

router.get('/themes/list/:hash', (req, res) => {
    const request = validators.validateRequestParameters(req, res, schemas.configGet);

    if (!request) return;

    listThemes(request.hash)
        .then(config => {
            return res.json(config);
        })
        .catch(err => {
            return res.status(err.status).json(err);
        })
});

router.post('/themes/edit/colors/:hash/:id', (req, res) => {
    const params = validators.validateRequestParameters(req, res, schemas.themeGet);
    if (!params) return;

    const body = validators.validateRequestBody(req, res, schemas.themePostBody);
    if (!body) return;

    editTheme(params.hash, params.id, 'colors', { key: body.key, value: body.value })
        .then(status => {
            return res.json(status);
        })
        .catch(err => {
            return res.status(err.status).json(err);
        })
});

router.post('/themes/edit/background/:hash/:id', (req, res) => {
    const params = validators.validateRequestParameters(req, res, schemas.themeGet);
    if (!params) return;

    const body = validators.validateRequestBody(req, res, schemas.themePostBody);
    if (!body) return;

    editTheme(params.hash, params.id, 'background', { key: body.key, value: body.value })
        .then(status => {
            return res.json(status);
        })
        .catch(err => {
            return res.status(err.status).json(err);
        })
});

module.exports = router;