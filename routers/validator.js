const Joi = require('joi');





const configGet = Joi.object({
    hash: Joi.string().required().length(24)
});

const themeGet = Joi.object({
    hash: Joi.string().required().length(24),
    id: Joi.string().required()
});


const validateRequestParameters = (req, res, schema = {}) => {
    const result = schema.validate(req.params);
    if (result.error) {
        res.status(400).send({ err: result.error.details[0].message });
        return null;
    }

    return result.value;
}

const validateRequestBody = (req, res, schema = {}) => {
    const result = schema.validate(req.body);

    if (result.error) {
        res.status(400).send({ err: result.error.details[0].message });
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
        themeGet
    }
}