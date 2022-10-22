const express = require('express');
const router = express.Router();
const { schemas, validators } = require('./validator');
const { theme } = require('../database/database');
const authentication = require('../database/authentication');

const limiter = require('./rate-limit');

router.post('/themes/create/:hash', limiter.create, async (req, res) => {
    const request = validators.validateRequestParameters(req, res, schemas.configGet);
    if (!request) return;

    const auth = await authentication.validateToken(req, res);
    if (!auth) return;

    theme.createTheme(auth)
        .then(hash => {
            return res.json({ session: hash });
        })
        .catch(err => {
            console.log(err);
            return res.status(err.status).json(err);
        })
});

router.get('/themes/defaults/get/:id', limiter.cacheable, async (req, res) => {
    const request = validators.validateRequestParameters(req, res, schemas.themeGetDefault);
    if (!request) return;

    theme.getDefaultTheme(request.id)
        .then(config => {
            return res.json(config);
        })
        .catch(err => {
            console.log(err);
            return res.status(err.status).json(err);
        })
});

router.get('/themes/get/:id', async (req, res) => {
    const request = validators.validateRequestParameters(req, res, schemas.themeGet);
    if (!request) return;

    const auth = await authentication.validateToken(req, res);
    if (!auth) return;

    theme.getTheme(auth, request.id)
        .then(config => {
            return res.json(config);
        })
        .catch(err => {
            console.log(err);
            return res.status(err.status).json(err);
        })
});


router.get('/themes/list/', async (req, res) => {
    const auth = await authentication.validateToken(req, res);
    if (!auth) return;

    theme.listThemes(auth)
        .then(config => {
            return res.json(config);
        })
        .catch(err => {
            console.log(err);
            return res.status(err.status).json(err);
        })

});

router.post('/themes/:id/edit/colors', async (req, res) => {
    const params = validators.validateRequestParameters(req, res, schemas.themeGet);
    if (!params) return;

    const body = validators.validateRequestBody(req, res, schemas.themePostBody);
    if (!body) return;

    const auth = await authentication.validateToken(req, res);
    if (!auth) return;

    theme.editTheme(auth, params.id, 'colors', { key: body.key, value: body.value })
        .then(status => {
            return res.json(status);
        })
        .catch(err => {
            console.log(err);
            return res.status(err.status).json(err);
        })
});

router.post('/themes/:id/edit/background/', async (req, res) => {
    const params = validators.validateRequestParameters(req, res, schemas.themeGet);
    if (!params) return;

    const body = validators.validateRequestBody(req, res, schemas.themePostBody);
    if (!body) return;

    const auth = await authentication.validateToken(req, res);
    if (!auth) return;

    theme.editTheme(auth, params.id, 'background', { key: body.key, value: body.value })
        .then(status => {
            return res.json(status);
        })
        .catch(err => {
            console.log(err);
            return res.status(err.status).json(err);
        })
});

router.post('/themes/:id/remove', limiter.create, async (req, res) => {
    const request = validators.validateRequestParameters(req, res, schemas.themeGet);
    if (!request) return;

    const auth = await authentication.validateToken(req, res);
    if (!auth) return;

    theme.removeTheme(auth, request.id)
        .then(config => {
            return res.json(config);
        })
        .catch(err => {
            return res.status(err.status).json(err);
        })
});


module.exports = router;