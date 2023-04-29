const { MongoClient } = require('mongodb');
const {} = require('./authentication');
const { user, password, host, port } = require('./secret.json');

const { config } = require('./user-schema');
const { public } = require('./public-api');

const url = `mongodb://${user}:${password}@${host}:${port}/?authMechanism=DEFAULT`;
//const url = `mongodb://127.0.0.1:27017`;

const appendPlanned = (auth, code) => {
    return new Promise((resolve, reject) => {
        config.getConfig(auth)
            .then(config => {
                if(!config['public']) return reject({err: 'Your course-selections are not public', status: 400});

                public.getInformation(auth, {username: auth.username})
                    .then(data => {
                        if(data['planned'] && data['planned'].includes(code)) return reject({err: 'You are already planning to take this course', status: 400});
                        
                        MongoClient.connect(url, (err, database) => {
                            if (err) return reject({ err: 'Failed to connect to database', status: 500 });
                
                            const db = database.db('OtaWilma');
                            const query = {
                                username: auth.username,
                            };
                
                            const update = {
                                $push: {
                                    planned: code
                                }
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
    })
}

const removePlanned = (auth, code) => {
    return new Promise((resolve, reject) => {
        config.getConfig(auth)
            .then(config => {
                if(!config['public']) return reject({err: 'Your course-selections are not public', status: 400});

                public.getInformation(auth, {username: auth.username})
                    .then(data => {
                        if(data['planned'] && !data['planned'].includes(code)) return reject({err: 'You are not planning to take this course', status: 400});
                        
                        MongoClient.connect(url, (err, database) => {
                            if (err) return reject({ err: 'Failed to connect to database', status: 500 });
                
                            const db = database.db('OtaWilma');
                            const query = {
                                username: auth.username,
                            };
                
                            const update = {
                                $pull: {
                                    planned: code
                                }
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
    })
}

const getMyPlan = (auth) => {
    return new Promise((resolve, reject) => {
        MongoClient.connect(url, (err, database) => {
            if (err) return reject({ err: 'Failed to connect to database', status: 500 });

            const db = database.db('OtaWilma');
            const query = {
                username: auth.username
            };

            const projection = {
                '_id': 0,
                'access-tokens': 0,
                'access-list': 0,
            }

            db.collection('public-api').find(query, {projection: projection}).toArray((err, res) => {
                if (err) return reject({ err: 'Failed to connect to database', status: 500 });
                if(!res[0]) return resolve([])
                console.log(res[0]['planned']);
                return resolve(res[0] && res[0]['planned'] ? res[0]['planned'] : [])
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

                res.forEach(f => result[f.username] = f['planned'] ?? []);
                return resolve(result)
            })
        })
    });
}

module.exports = {
    planned: {
        appendPlanned,
        removePlanned,
        getAccessList,
        getMyPlan
    }
}
