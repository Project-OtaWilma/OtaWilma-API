const { MongoClient } = require('mongodb');
const { user, password, host, port } = require('./secret.json');
const { defaultConfig, defaultThemes } = require('./default.json');
const { generate } = require('shortid');
const {} = require('./authentication');

const { config } = require('./user-schema');

const url = `mongodb://${user}:${password}@${host}:${port}/?authMechanism=DEFAULT`;
//const url = `mongodb://127.0.0.1:27017`;

const getTotalUsers = () => {
    return new Promise((resolve, reject) => {
        MongoClient.connect(url, (err, database) => {
            if (err) return reject({ err: 'Failed to connect to database', status: 500 });

            const db = database.db('OtaWilma');

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

module.exports = {
    statistics: {
        getTotalUsers
    }
}