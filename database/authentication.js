const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const { signature } = require('./secret.json');

const signToken = (payload = {}) => {
    return jwt.sign(payload, signature, { expiresIn: 60 * 60 });
}

const validateToken = (req, res) => {
    return new Promise((resolve, reject) => {
        const token = req.headers.token;
        if(!token) {
            res.status(401).json({err: 'Missing authentication parameters: ["token"]', status: 401});
            return resolve(null);
        }
        
        jwt.verify(token, signature, (err, decoded) => {
            if(err) {
                res.status(400).json({err: 'Received invalid jwt token', status: 400})
                return resolve(null);
            }

            return resolve(decoded);
        });
    });
    
}

module.exports = {
    signToken,
    validateToken
}