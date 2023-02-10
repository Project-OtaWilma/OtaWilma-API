const express = require('express');
const router = express.Router();
const { schemas, validators } = require('./validator');
const { public } = require('../database/public-api');
const { planned } = require('../database/plan-api');
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
            return res.status(err.status ?? 500).json(err);
        })
    
});

router.post('/public-api/update-selections', async (req, res) => {
    const auth = await authentication.validateToken(req, res);
    if (!auth) return;

    public.update(auth)
        .then(result => {
            return res.json(result);
        })
        .catch(err => {
            console.log(err);
            return res.status(err.status ?? 500).json(err);
        })
});

router.post('/public-api/tokens/generate', async (req, res) => {
    const auth = await authentication.validateToken(req, res);
    if (!auth) return;

    public.generateAccessToken(auth)
        .then(result => {
            return res.json(result);
        })
        .catch(err => {
            console.log(err);
            return res.status(err.status ?? 500).json(err);
        })
});

router.post('/public-api/tokens/invalidate/:hash', async (req, res) => {
    const auth = await authentication.validateToken(req, res);
    if (!auth) return;

    const request = await validators.validateRequestParameters(req, res, schemas.token);
    if(!request) return;

    public.invalidateAccessToken(auth, request.hash)
        .then(result => {
            return res.json(result);
        })
        .catch(err => {
            console.log(err);
            return res.status(err.status ?? 500).json(err);
        });
});

router.post('/public-api/tokens/use/:hash', async (req, res) => {
    const auth = await authentication.validateToken(req, res);
    if (!auth) return;

    const request = await validators.validateRequestParameters(req, res, schemas.token);
    if(!request) return;

    public.useToken(auth, request.hash)
        .then(result => {
            return res.json(result);
        })
        .catch(err => {
            console.log(err);
            return res.status(err.status ?? 500).json(err);
        });
});

router.get('/public-api/tokens/list', async (req, res) => {
    const auth = await authentication.validateToken(req, res);
    if (!auth) return;

    public.getAccessTokens(auth)
        .then(result => {
            return res.json(result);
        })
        .catch(err => {
            console.log(err);
            return res.status(err.status ?? 500).json(err);
        });
});

router.get('/public-api/friends', async (req, res) => {
    const auth = await authentication.validateToken(req, res);
    if (!auth) return;

    public.getAccessList(auth)
        .then(result => {
            return res.json(result);
        })
        .catch(err => {
            console.log(err);
            return res.status(err.status ?? 500).json(err);
        });
});

router.get('/public-api/get/:hash', async (req, res) => {
    const auth = await authentication.validateToken(req, res);
    if (!auth) return;

    const request = await validators.validateRequestParameters(req, res, schemas.token);
    if(!request) return;

    public.getInformation(auth, {hash: request.hash})
        .then(result => {
            return res.json(result);
        })
        .catch(err => {
            console.log(err);
            return res.status(err.status ?? 500).json(err);
        });
});

router.post('/plan-api/planned/add/:code', async (req, res) => {
    const auth = await authentication.validateToken(req, res);
    if (!auth) return;

    const request = await validators.validateRequestParameters(req, res, schemas.code);
    if(!request) return;

    planned.appendPlanned(auth, request.code)
        .then(result => {
            return res.json(result);
        })
        .catch(err => {
            console.log(err);
            return res.status(err.status ?? 500).json(err);
        });
});

router.post('/plan-api/planned/remove/:code', async (req, res) => {
    const auth = await authentication.validateToken(req, res);
    if (!auth) return;

    const request = await validators.validateRequestParameters(req, res, schemas.code);
    if(!request) return;

    planned.removePlanned(auth, request.code)
        .then(result => {
            return res.json(result);
        })
        .catch(err => {
            return res.status(err.status ?? 500).json(err);
        });
});

router.get('/plan-api/self', async (req, res) => {
    const auth = await authentication.validateToken(req, res);
    if (!auth) return;

    planned.getMyPlan(auth)
        .then(result => {
            return res.json(result);
        })
        .catch(err => {
            return res.status(err.status ?? 500).json(err);
        });
});
 
router.get('/plan-api/friends', async (req, res) => {
    const auth = await authentication.validateToken(req, res);
    if (!auth) return;

    planned.getAccessList(auth)
        .then(result => {
            return res.json(result);
        })
        .catch(err => {
            console.log(err);
            return res.status(err.status ?? 500).json(err);
        });
});



module.exports = router;