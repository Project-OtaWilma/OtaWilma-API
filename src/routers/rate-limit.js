const rateLimit = require('express-rate-limit');


const message = { err: 'rate-limit violation', status: 429 }

/*
    Standard rate-limit that is enforced for every endpoint
    (250 request / 10 min)
*/
const standard = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 250,
    standardHeaders: true,
    message: { ...message, info: 'standard' }
});

/*
    Rate-limit for cacheable resources such as default themes
    (25 request / 10 min)
*/
const cacheable = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    message: { ...message, info: 'cacheable' }
})

/*
    Rate-limit for creating and removing resources.
    (30 request / 0.5 hour)
*/
const create = rateLimit({
    windowMs: 30 * 60 * 1000,
    max: 25,
    standardHeaders: true,
    message: { ...message, info: 'create' }
})

/*
    Rate-limit for rarely used actions such as account creation
    (5 request / 1 hour)
*/
const strict = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    message: { ...message, info: 'strict' }
})

module.exports = {
    standard,
    cacheable,
    create,
    strict
}