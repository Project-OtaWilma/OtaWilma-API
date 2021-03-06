const Joi = require('joi');

const configLogin = Joi.object({
    hash: Joi.string().required().length(24),
    username: Joi.string().required()
});

const configCreate = Joi.object({
    username: Joi.string().required()
});

const configGet = Joi.object({
    hash: Joi.string().required().length(24)
});

const configSetBody = Joi.object({
    theme: Joi.string().required().max(12)
});

const themeGetDefault = Joi.object({
    id: Joi.string().required()
});

const themeGet = Joi.object({
    hash: Joi.string().required().length(24),
    id: Joi.string().required()
});

const themePostBody = Joi.object({
    key: Joi.string().max(128).required(),
    value: Joi.string().max(1024).required().allow('')
});

const validateRequestParameters = (req, res, schema = {}) => {
    const result = schema.validate(req.params);
    if (result.error) {
        res.status(400).send({ err: result.error.details[0].message, status: 400 });
        return null;
    }

    return result.value;
}

const validateRequestBody = (req, res, schema = {}) => {
    const result = schema.validate(req.body);

    if (result.error) {
        res.status(400).send({ err: result.error.details[0].message, status: 400 });
        return null;
    }

    return result.value;
}

module.exports = {
    validators: {
        validateRequestParameters,
        validateRequestBody
    },
    schemas: {
        configLogin,
        configCreate,
        configGet,
        configSetBody,
        themeGetDefault,
        themeGet,
        themePostBody
    }
}