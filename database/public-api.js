const { MongoClient } = require('mongodb');
const { user, password, host, port } = require('./secret.json');
const { defaultConfig, defaultTheme } = require('./default.json');
const { generate } = require('shortid');
const {} = require('./authentication');

const request = require('request');
const { config } = require('./user-schema');

const { generateHash } = require('./utility');
const utility = require('./utility');

const url = `mongodb://${user}:${password}@${host}:${port}/?authMechanism=DEFAULT`;
//const url = `mongodb://localhost:27017`;

const wilmaAPI = 'https://beta.wilma-api.tuukk.dev/api/';
//const wilmaAPI = 'http://localhost:3001/api/';

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
                        'access-tokens': {},
                        'access-list': [],
                        hash: hash
                    }

                    db.collection('public-api').replaceOne(query, value, {upsert: true}, (err, res) => {
                        if (err) return reject({ err: 'Failed to connect to database', status: 500 });

                        config.setPublicFlag(auth)
                        .then(() => {
                            return resolve({hash: hash})
                        })
                        .catch(err => {
                            return reject(err);
                        })

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

const update = (auth) => {
    return new Promise((resolve, reject) => {
        config.getConfig(auth)
            .then(config => {
                fetchUserData(auth)
                .then(data => {
                    if(!config['public']) return resolve({...data, updated: false});

                    MongoClient.connect(url, (err, database) => {
                        if (err) return reject({ err: 'Failed to connect to database', status: 500 });
        
                        const db = database.db('OtaWilma');
                        const query = {username: auth.username};
                        const update = {
                            $set: {
                                selected: data
                            },
                        }

                        db.collection('public-api').updateOne(query, update, (err, res) => {
                            if (err) return reject({ err: 'Failed to connect to database', status: 500 });

                            return resolve({data, updated: true})
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

const getToken = (auth, hash) => {
    return new Promise((resolve, reject) => {
        MongoClient.connect(url, (err, database) => {
            if (err) return reject({ err: 'Failed to connect to database', status: 500 });

            const db = database.db('OtaWilma');
            const query = {
                [`access-tokens.${hash}`]: { $exists: true}
            };

            db.collection('public-api').findOne(query, (err, res) => {
                if (err) return reject({ err: 'Failed to connect to database', status: 500 });
                
                if(!res) return reject({err: 'Invalid access-token', status: 401})

                return resolve({
                    exists: res['access-list'].includes(auth.username),
                    token: res['access-tokens'][hash],
                    owner: res['username'],
                    hash: res['hash']
                });
            })
        })
    })
}

const generateAccessToken = (auth) => {
    return new Promise((resolve, reject) => {
        config.getConfig(auth)
            .then(config => {
                if(!config['public']) return reject({err: 'Your course-selections are not public', status: 401});

                MongoClient.connect(url, async (err, database) => {
                    if (err) return reject({ err: 'Failed to connect to database', status: 500 });

                    const hash = await utility.generateHash();
    
                    const db = database.db('OtaWilma');
                    const query = {username: auth.username};
                    const update = {
                        $set: {
                            [`access-tokens.${hash}`]: {
                                used: false,
                                user: null
                            },
                        },
                    }

                    db.collection('public-api').updateOne(query, update, (err, res) => {
                        if (err) return reject({ err: 'Failed to connect to database', status: 500 });

                        return resolve({hash: hash})
                    })
                })

            })
            .catch(err => {
                return reject(err);
            })
    });
}

const invalidateAccessToken = (auth, hash) => {
    return new Promise((resolve, reject) => {
        config.getConfig(auth)
            .then(config => {
                if(!config['public']) return reject({err: 'Your course-selections are not public', status: 401});

                getToken(auth, hash)
                .then(res => {
                    MongoClient.connect(url, (err, database) => {
                        if (err) return reject({ err: 'Failed to connect to database', status: 500 });
        
                        const db = database.db('OtaWilma');
                        const query = {username: auth.username};

                        const update = {
                            $unset: {[`access-tokens.${hash}`]: 1},
                            $pull: {'access-list': res['token'].user}
                        }

                        db.collection('public-api').updateOne(query, update, (err, res) => {
                            if (err) return reject({ err: 'Failed to connect to database', status: 500 });
    
                            return resolve({success: true})
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
    });
}

const useToken = (auth, hash) => {
    return new Promise((resolve, reject) => {
        config.getConfig(auth)
            .then(() => {

                getToken(auth, hash)
                .then(res => {
                    if(res['exists']) return reject({err: 'You have already access to this information', status: 400});
                    if(res['token'].used) return reject({err: 'Invalid access-token', status: 401});
                    const owner = res['owner'];

                    if(auth.username == owner) return reject({err: 'You cannot use your own access-token', status: 401});

                    MongoClient.connect(url, (err, database) => {
                        if (err) return reject({ err: 'Failed to connect to database', status: 500 });
        
                        const db = database.db('OtaWilma');
                        const query = {hash: res['hash']};
                        const update = {
                            $set: {
                                [`access-tokens.${hash}`]: {
                                    used: true,
                                    user: auth.username
                                },
                            },
                            $push: {
                                'access-list': auth.username
                            }
                        }
    
                        db.collection('public-api').updateOne(query, update, (err, res) => {
                            console.log(err);
                            if (err) return reject({ err: 'Failed to connect to database', status: 500 });
                            
                            return resolve({owner: owner})
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
    });
}

const getAccessTokens = (auth) => {
    return new Promise((resolve, reject) => {
        MongoClient.connect(url, (err, database) => {
            if (err) return reject({ err: 'Failed to connect to database', status: 500 });

            const db = database.db('OtaWilma');
            const query = {
                username: auth.username
            };

            const projection = {
                '_id': 0,
                'username': 0,
                'hash': 0,
                'selected': 0,
                'access-list': 0,
            }

            db.collection('public-api').findOne(query, {projection: projection}, (err, res) => {
                console.log(err);
                if (err) return reject({ err: 'Failed to connect to database', status: 500 });

                return resolve((Object.keys(res['access-tokens']).map(hash => {return {...res['access-tokens'][hash], hash: hash}})))
            })
        })
    });
}

const getAccessList = (auth) => {
    return new Promise((resolve, reject) => {

        MongoClient.connect(url, (err, database) => {
            if (err) return reject({ err: 'Failed to connect to database', status: 500 });

            const db = database.db('OtaWilma');
            const query = {
                'access-list': auth.username
            };

            const projection = {
                '_id': 0,
                'access-tokens': 0,
                'access-list': 0,
            }

            db.collection('public-api').find(query, {projection: projection}).toArray((err, res) => {
                console.log(err);
                if (err) return reject({ err: 'Failed to connect to database', status: 500 });
                const result = {};

                res.forEach(f => result[f.username] = f['selected'].map(c => c.code));
                return resolve(result)
            })
        })
    });
}

const getInformation = (auth, hash) => {
    return new Promise((resolve, reject) => {
        MongoClient.connect(url, (err, database) => {
            if (err) return reject({ err: 'Failed to connect to database', status: 500 });

            const db = database.db('OtaWilma');
            const query = {
                hash: hash,
            };

            const projection = {
                '_id': 0,
                'access-tokens': 0,
                'access-list': 0,
                'hash': 0
            }

            db.collection('public-api').findOne(query, {projection: projection}, (err, res) => {
                if (err) return reject({ err: 'Failed to connect to database', status: 500 });

                if(err) return reject({err: 'Invalid access token'});

                return resolve(res)
            })
        })
    });
}

module.exports = {
    public: {
        publish,
        update,
        generateAccessToken,
        invalidateAccessToken,
        useToken,
        getAccessList,
        getAccessTokens,
        getInformation
    }
}