const express = require('express');
const router = express.Router();
const { schemas, validators } = require('./validator');
const { public } = require('../database/public-api');
const { friends } = require('../database/friends');
const authentication = require('../database/authentication');

const limiter = require('./rate-limit');

router.post('/friends/send-request/:username', limiter.create, async (req, res) => {
    const request = validators.validateRequestParameters(req, res, schemas.friendRequest);
    if(!request) return;

    const auth = await authentication.validateToken(req, res);
    if (!auth) return;

    friends.sendFriendRequest(auth, request.username)
        .then(result => {
            return res.json(result);
        })
        .catch(err => {
            console.log(err);
            return res.status(err.status).json(err);
        })
    
});

router.post('/friends/accept-request/:username', limiter.create, async (req, res) => {
    const request = validators.validateRequestParameters(req, res, schemas.friendRequest);
    if(!request) return;

    const auth = await authentication.validateToken(req, res);
    if (!auth) return;

    friends.acceptFriendRequest(auth, request.username)
        .then(result => {
            return res.json(result);
        })
        .catch(err => {
            console.log(err);
            return res.status(err.status).json(err);
        })
    
});

router.post('/friends/decline-request/:username', limiter.create, async (req, res) => {
    const request = validators.validateRequestParameters(req, res, schemas.friendRequest);
    if(!request) return;

    const auth = await authentication.validateToken(req, res);
    if (!auth) return;

    friends.declineFriendRequest(auth, request.username)
        .then(result => {
            return res.json(result);
        })
        .catch(err => {
            console.log(err);
            return res.status(err.status).json(err);
        })
    
});

router.post('/friends/block/:username', limiter.create, async (req, res) => {
    const request = validators.validateRequestParameters(req, res, schemas.friendRequest);
    if(!request) return;

    const auth = await authentication.validateToken(req, res);
    if (!auth) return;

    friends.blockUser(auth, request.username)
        .then(result => {
            return res.json(result);
        })
        .catch(err => {
            console.log(err);
            return res.status(err.status).json(err);
        })
    
});

router.post('/friends/unblock/:username', limiter.create, async (req, res) => {
    const request = validators.validateRequestParameters(req, res, schemas.friendRequest);
    if(!request) return;

    const auth = await authentication.validateToken(req, res);
    if (!auth) return;

    friends.unblockUser(auth, request.username)
        .then(result => {
            return res.json(result);
        })
        .catch(err => {
            console.log(err);
            return res.status(err.status).json(err);
        })
});

router.post('/friends/requests/list', limiter.create, async (req, res) => {
    const auth = await authentication.validateToken(req, res);
    if (!auth) return;

    friends.listFriendRequests(auth)
        .then(result => {
            return res.json(result);
        })
        .catch(err => {
            console.log(err);
            return res.status(err.status).json(err);
        })
});




module.exports = router;