const Joi = require('joi');

const configGet = Joi.object({
    hash: Joi.string().required().length(24)
});

const configSetBody = Joi.object({
    theme: Joi.string().required().max(12)
});

const themeCreate = Joi.object({
    preset: Joi.string().required().valid('light', 'dark')
})

const themeGetDefault = Joi.object({
    id: Joi.string().required().max(256)
});

const themeGet = Joi.object({
    id: Joi.string().required().max(256)
});

const themePostBody = Joi.object({
    key: Joi.string().max(128).required(),
    value: Joi.string().max(1024).required().allow('')
});

const token = Joi.object({
    hash: Joi.string().max(256)
})

const code = Joi.object({
    code: Joi.string().max(64).required()
})

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
        configGet,
        configSetBody,
        themeGetDefault,
        themeGet,
        themePostBody,
        token,
        themeCreate,
        code
    }
}