const { MongoClient } = require('mongodb');
const { user, password, host, port } = require('./secret.json');
const { defaultConfig, defaultTheme } = require('./default.json');
const { generate } = require('shortid');
const {} = require('./authentication');

const request = require('request');
const { config } = require('./user-schema');
const { resolve } = require('path');

const { generateHash } = require('./utility')

// const url = `mongodb://${user}:${password}@${host}:${port}/?authMechanism=DEFAULT`;
const url = `mongodb://localhost:27017`;

//const wilmaAPI = 'https://wilma-api.tuukk.dev/api/';
const wilmaAPI = 'http://localhost:3001/api/';

const fetchUserData = (auth) => {
    return new Promise((resolve, reject) => {
        request({
            uri: `${wilmaAPI}course-tray/selected/list`,
            method: 'GET',
            headers: {
                'token': auth.raw
            }
        }, (err, res) => {
            if(err) return reject({err: "Failed to connect to Wilma's API", status: 500});

            const json = JSON.parse(res.body);

            if(res.statusCode != 200) return reject(json);

            return resolve(json);
        });
    })
}

const publish = (auth) => {
    return new Promise((resolve, reject) => {
        fetchUserData(auth)
        .then(data => {
            generateHash()
            .then(hash => {

                MongoClient.connect(url, (err, database) => {
                    if (err) return reject({ err: 'Failed to connect to database', status: 500 });
    
                    const db = database.db('OtaWilma');
                    const query = {username: auth.username};
                    const value = {
                        username: auth.username,
                        selected: data,
                        hash: hash
                    }

                    db.collection('public-api').replaceOne(query, value, {upsert: true}, (err, res) => {
                        if (err) return reject({ err: 'Failed to connect to database', status: 500 });

                        return resolve({hash: hash})
                    })
                })
            })
            .catch(err => {
                return reject(err);
            })

        })
        .catch(err => {
            return reject(err);
        })
    })
}

module.exports = {
    public: {
        publish
    }
}