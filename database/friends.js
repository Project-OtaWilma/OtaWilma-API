const crypto = require('crypto');
const { MongoClient } = require('mongodb');
const { user, password, host, port } = require('./secret.json');
const { defaultConfig, defaultTheme } = require('./default.json');
const { generate } = require('shortid');
const {} = require('./authentication');

const { config } = require('./user-schema');
const { resolve } = require('path');

// const url = `mongodb://${user}:${password}@${host}:${port}/?authMechanism=DEFAULT`;
const url = `mongodb://localhost:27017`;

const sendFriendRequest = (auth, username) => {
    return new Promise((resolve, reject) => {
        if(auth.username == username) return reject({err: 'Cannot send friend-request to yourself', status: 400});

        config.getConfig({username: username})
            .then(friend => {
                
                if(friend['block-list'].includes(auth.username)) return reject({err: "Couldn't send friend-request to this person", status: 401})
                if(friend['friend-requests'].includes(auth.username)) return reject({err: 'You have already one outgoing friend-request to this person', status: 401})
                if(friend['friends'].includes(auth.username)) return reject({err: 'You are already friends with this user', status: 401})

                MongoClient.connect(url, (err, database) => {
                    if (err) return reject({ err: 'Failed to connect to database', status: 500 });
        
                    const db = database.db('OtaWilma');
                    const query = { username: username }

                    const update = {
                        $push: {
                            'friend-requests': auth.username
                        },
                        $pull: {
                            'block-list': auth.username
                        }
                    }
        
                    db.collection('user-schema').updateOne(query, update, (err, res) => {
                        console.log(err);
                        database.close();
                        if (err) return reject({ err: 'Failed to connect to database', status: 500 });
        
                        return resolve({success: true});
                    });
                })
            })
            .catch(err => {
                return reject(err);
            }) 
    });
}

const listFriendRequests = (auth) => {
    return new Promise((resolve, reject) => {
        config.getConfig({username: auth.username})
            .then(config => {

                return resolve(config['friend-requests']);
            })
            .catch(err => {
                return reject(err);
            }) 
    });
}

const acceptFriendRequest = (auth, username) => {
    return new Promise((resolve, reject) => {
        if(auth.username == username) return reject({err: 'Cannot accept friend-request from yourself - not like you could have one anyways', status: 400});

        config.getConfig({username: auth.username})
            .then(config => {

                if(!config['friend-requests'].includes(username)) return reject({err: "You don't have a friend-request from this user", status: 400});

                MongoClient.connect(url, (err, database) => {
                    if (err) return reject({ err: 'Failed to connect to database', status: 500 });
        
                    const db = database.db('OtaWilma');
                    const query = { username: auth.username }

                    const update = {
                        $push: {
                            'friends': username
                        },
                        $pull: {
                            'friend-requests': username
                        }
                    }
        
                    db.collection('user-schema').updateOne(query, update, (err, res) => {
                        if (err) {
                            database.close();
                            return reject({ err: 'Failed to connect to database', status: 500 });
                        }

                        const query = { username: username }

                        const update = {
                            $push: {
                                'friends': auth.username
                            },
                            $pull: {
                                'friend-requests': auth.username
                            }
                        }
            
                        db.collection('user-schema').updateOne(query, update, (err, res) => {
                            database.close();
                            if (err) return reject({ err: 'Failed to connect to database', status: 500 });
            
                            return resolve({success: true});
                        });
                    });
                })
            })
            .catch(err => {
                return reject(err);
            }) 
    });
}

const declineFriendRequest = (auth, username) => {
    return new Promise((resolve, reject) => {
        if(auth.username == username) return reject({err: 'Cannot decline friend-request from yourself - not like you could have one anyways', status: 400});

        config.getConfig({username: auth.username})
            .then(config => {

                if(!config['friend-requests'].includes(username)) return reject({err: "You don't have a friend-request from this user", status: 400});

                MongoClient.connect(url, (err, database) => {
                    if (err) return reject({ err: 'Failed to connect to database', status: 500 });
        
                    const db = database.db('OtaWilma');
                    const query = { username: auth.username }

                    const update = {
                        $pull: {
                            'friend-requests': username
                        }
                    }
        
                    db.collection('user-schema').updateOne(query, update, (err, res) => {
                        if (err) {
                            database.close();
                            return reject({ err: 'Failed to connect to database', status: 500 });
                        }

                        const query = { username: username }

                        const update = {
                            $pull: {
                                'friend-requests': auth.username
                            }
                        }
            
                        db.collection('user-schema').updateOne(query, update, (err, res) => {
                            database.close();
                            if (err) return reject({ err: 'Failed to connect to database', status: 500 });
            
                            return resolve({success: true});
                        });
                    });
                })
            })
            .catch(err => {
                return reject(err);
            }) 
    });
}

const blockUser = (auth, username) => {
    return new Promise((resolve, reject) => {
        if(auth.username == username) return reject({err: 'Cannot block yourself', status: 400});

        config.getConfig({username: auth.username})
            .then(config => {

                if(config['block-list'].includes(username)) return reject({err: "This user is already blocked", status: 400});

                MongoClient.connect(url, (err, database) => {
                    if (err) return reject({ err: 'Failed to connect to database', status: 500 });
        
                    const db = database.db('OtaWilma');
                    const query = { username: auth.username }

                    const update = {
                        $pull: {
                            'friend-requests': username
                        },
                        $pull: {
                            'friends': username
                        },
                        $push: {
                            'block-list': username
                        }
                    }
        
                    db.collection('user-schema').updateOne(query, update, (err, res) => {
                        if (err) {
                            database.close();
                            return reject({ err: 'Failed to connect to database', status: 500 });
                        }

                        const query = { username: username }

                        const update = {
                            $pull: {
                                'friend-requests': auth.username
                            },
                            $pull: {
                                'friends': auth.username
                            }
                        }
            
                        db.collection('user-schema').updateOne(query, update, (err, res) => {
                            database.close();
                            if (err) return reject({ err: 'Failed to connect to database', status: 500 });
            
                            return resolve({success: true});
                        });
                    });
                })
            })
            .catch(err => {
                return reject(err);
            }) 
    });
}

const unblockUser = (auth, username) => {
    return new Promise((resolve, reject) => {
        if(auth.username == username) return reject({err: 'Cannot block yourself', status: 400});

        config.getConfig({username: auth.username})
            .then(config => {

                if(!config['block-list'].includes(username)) return reject({err: "This user is not blocked", status: 400});

                MongoClient.connect(url, (err, database) => {
                    if (err) return reject({ err: 'Failed to connect to database', status: 500 });
        
                    const db = database.db('OtaWilma');
                    const query = { username: auth.username }

                    const update = {
                        $pull: {
                            'block-list': username
                        }
                    }
        
                    db.collection('user-schema').updateOne(query, update, (err, res) => {
                        if (err) {
                            database.close();
                            return reject({ err: 'Failed to connect to database', status: 500 });
                        }

                        return resolve({success: true});
                    });
                })
            })
            .catch(err => {
                return reject(err);
            }) 
    });
}


module.exports = {
    friends: {
        sendFriendRequest,
        acceptFriendRequest,
        declineFriendRequest,
        blockUser,
        unblockUser,
        listFriendRequests
    }
}