const { MongoClient } = require('mongodb');
const { user, password, host, port, authServer } = require('../secret.json');
const { defaultConfig, defaultTheme } = require('./default.json');
const { generate } = require('shortid');
const {} = require('./authentication');

const url = `mongodb://${user}:${password}@${host}:${port}/wilma?authMechanism=DEFAULT&authSource=${authServer}`;
//const url = `mongodb://127.0.0.1:27017`;

const login = (auth) => {
    return new Promise((resolve, reject) => {
        MongoClient.connect(url, (err, database) => {
            if (err) return reject({ err: 'Failed to connect to database', status: 500 });

            const db = database.db('otawilma');
            const query = { username: auth.username.toLowerCase() }

            db.collection('user-schema').find(query).toArray((err, res) => {
                if (err) return reject({ err: 'Failed to connect to database', status: 500 });

                const timeStamp = (new Date()).getTime()
                const config = res[0] ? res[0] : { ...{ username: auth.username }, ...defaultConfig, ...{joinDate: timeStamp}};

                if(config['login-history'].length >= 5) config['login-history'].shift();
                config['login-history'].push(timeStamp);

                db.collection('user-schema').findOneAndReplace(query, config, {upsert: true}, (err, res) => {
                    database.close();
                    if (err) return reject({ err: 'Failed to connect to database', status: 500 });
    
                    return resolve();
                });

            });
        })
    });
}

const getConfig = (auth) => {
    return new Promise((resolve, reject) => {
        MongoClient.connect(url, (err, database) => {
            if (err) return reject({ err: 'Failed to connect to database', status: 500 });

            const db = database.db('otawilma');
            const query = { username: auth.username }
            const projection = {
                '_id': 0
            }

            db.collection('user-schema').find(query).project(projection).toArray((err, res) => {
                if (err) return reject({ err: 'Failed to connect to database', status: 500 });

                database.close();

                if (res.length < 1) return reject({ err: "Couldn't locate configuration with specified hash", status: 400 });

                return resolve(res[0]);
            });
        })
    });
}

const getLoginHistory = (auth) => {

    return new Promise((resolve, reject) => {
        getConfig(auth)
        .then(config => {
            return resolve(config['login-history']);
        })
        .catch(err => {
            return reject(err);
        })
    });
}

const setTheme = (auth, id) => {
    return new Promise((resolve, reject) => {

        getConfig(auth)
            .then(config => {
                const themes = [...config['themes'], ...['light', 'dark']];

                if (!themes.includes(id)) return reject({ err: "configuration doesn't have this theme", status: 400 });

                MongoClient.connect(url, (err, database) => {
                    if (err) return reject({ err: 'Failed to connect to database', status: 500 });

                    const db = database.db('otawilma');

                    const query = { username: auth.username }
                    const values = { $set: { 'current-theme': id } }

                    db.collection('user-schema').updateOne(query, values, (err, res) => {
                        if (err) return reject({ err: 'Failed to connect to database', status: 500 });

                        database.close();

                        if (res.matchedCount < 1) return reject({ err: "Couldn't locate configuration with specified hash", status: 400 });

                        return resolve(res);
                    });
                })
            })
            .catch(err => {
                return reject(err);
            })

    })
}

const setPublicFlag = (auth) => {
    return new Promise((resolve, reject) => {
        getConfig(auth)
        .then(() => {
            
            MongoClient.connect(url, (err, database) => {
                if (err) return reject({ err: 'Failed to connect to database', status: 500 });

                const db = database.db('otawilma');

                const query = { username: auth.username }
                const values = { $set: { 'public': true } }

                db.collection('user-schema').updateOne(query, values, (err, res) => {
                    if (err) return reject({ err: 'Failed to connect to database', status: 500 });

                    database.close();

                    if (res.matchedCount < 1) return reject({ err: "Couldn't locate configuration with specified hash", status: 400 });

                    return resolve(res);
                });
            })
        })
        .catch(err => {
            return reject(err);
        })
    });
}



module.exports = {
    config: {
        login,
        getConfig,
        getLoginHistory,
        setTheme,
        setPublicFlag
    }
}