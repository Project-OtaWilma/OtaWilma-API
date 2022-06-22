const path = require('path');
const fs = require('fs');
const shortid = require('shortid');
const crypto = require('crypto');

const { themes, config } = require('../config.json');
const { defaultConfig, defaultTheme } = require('./default.json');

const createConfig = () => {
    return new Promise((resolve, reject) => {
        generateSessionHash()
        .then(hash => {

            const PATH = path.join(config.root, `${hash}.json`);

            fs.writeFile(PATH, JSON.stringify(defaultConfig), {}, (err) => {
                if(err) {
                    return reject({err: 'failed to create config file', error: 500})
                }

                return resolve(hash);
            })
        })
        .catch(() => {
            return reject({err: 'failed to generate secure hash', error: 500});
        })
    });
}

const getConfig = (hash) => {
    return new Promise((resolve, reject) => {
        const PATH = path.join(config.root, `${hash}.json`);

        fs.readFile(PATH, {}, (err, buffer) => {
            if(err) {
                switch(err.code) {
                    case 'ENOENT': 
                        return reject({err: "Couldn't locate config with specified hash", error: 404});
                    default:
                        return reject({err: 'failed to read config file', error: 500})
                }
            }

            const data = JSON.parse(buffer);
            return resolve(data);
        });
    });
}

const createTheme = (hash) => {
    return new Promise((resolve, reject) => {
        const id = shortid.generate();
    
        const PATH = path.join(themes.root, `${hash}.${id}.json`);
    
        fs.writeFile(PATH, JSON.stringify(defaultTheme), {}, (err) => {
            if(err) {
                return reject({err: 'failed to create config file', error: 500})
            }
    
            return resolve(id);
        })
    })
}

const getTheme = (hash, id) => {
    return new Promise((resolve, reject) => {
        const PATH = path.join(themes.root, `${hash}.${id}.json`);

        fs.readFile(PATH, {}, (err, buffer) => {
            if(err) {
                switch(err.code) {
                    case 'ENOENT': 
                        return reject({err: "Couldn't locate theme with specified hash", error: 404});
                    default:
                        return reject({err: 'failed to read theme file', error: 500})
                }
            }

            const data = JSON.parse(buffer);
            return resolve(data);
        });
    });
}


const generateSessionHash = () => {
    return new Promise((resolve, reject) => {
        crypto.randomBytes(12, (err, buffer) => {
            if(err) {
                return reject(err);
            }

            return resolve(buffer.toString('hex'));
        });
    });
}

module.exports = {
    createConfig,
    getConfig,
    createTheme,
    getTheme
}
