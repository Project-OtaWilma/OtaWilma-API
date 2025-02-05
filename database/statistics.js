const { MongoClient } = require('mongodb');
const { user, password, host, port, authServer } = require('../secret.json');
const { defaultConfig, defaultThemes } = require('./default.json');
const { generate } = require('shortid');
const {} = require('./authentication');
const request = require('request');

const { config } = require('./user-schema');

const url = `mongodb://${user}:${password}@${host}:${port}/wilma?authMechanism=DEFAULT&authSource=${authServer}`;
//const url = `mongodb://127.0.0.1:27017`;

const getTotalUsers = () => {
    return new Promise((resolve, reject) => {
        MongoClient.connect(url, (err, database) => {
            if (err) return reject({ err: 'Failed to connect to database', status: 500 });

            const db = database.db('otawilma');

            db.collection('user-schema').countDocuments()
            .then(num => {
                console.log(num);
                return resolve({ totalUsers: num });
            })
            .catch(err => {
                console.log(err);
                return reject({ err: 'Failed to count documents', status: 500 });
            })
        })
    })
}

const resolveWilmaResponsetime = () => {
    return new Promise((resolve, reject) => {
        const a = () => {
            return new Promise((resolve, reject) => {
                request({
                    uri: `https://espoo.inschool.fi/`,
                    method: 'GET',
                    time: true,
                    timeout: 9000
                }, (err, res) => {
                    if(err) return 9999
                    if(res.statusCode != 200) return resolve(9999);
                    
                    return resolve(res.elapsedTime);
                });
            })
        }

        Promise.all([a(), a()])
        .then(([a, b]) => {
            const avg = +((a + b) / 2).toFixed(0);
            return resolve(avg);
        })
        .catch(err => {
            return reject(err);
        })
    });
}

module.exports = {
    statistics: {
        getTotalUsers,
        resolveWilmaResponsetime
    }
}