const crypto = require('crypto');

module.exports= {
    generateHash: () => {
        return new Promise((resolve, reject) => {
            crypto.randomBytes(12, (err, buf) => {
                if(err) return reject({err: 'Failed to generate secure hash'})
                return resolve(buf.toString('hex'));
            })
        })
    }
}