const crypto = require('crypto');
const { MongoClient } = require('mongodb');
const { user, password, host, port } = require('./secret.json');
const { defaultConfig, defaultTheme } = require('./default.json');
const { generate } = require('shortid');
const { resolve } = require('path');

const url = `mongodb://${user}:${password}@${host}:${port}/?authMechanism=DEFAULT`;

const login = (hash, username) => {
    return new Promise((resolve, reject) => {
        getConfig(hash)
        .then(config => {
            MongoClient.connect(url, (err, database) => {
                if (err) {
                    return reject({ err: 'Failed to connect to database', status: 500 });
                }

                const loginHistory = config['login-history'] ? config['login-history'] : [];
                const date = new Date();

                loginHistory.push({timeStamp: date.getTime(), username: username});

                if(loginHistory.length > 5) loginHistory.shift();

                const db = database.db('OtaWilma');

                const query = {hash: hash}

                const update = {
                    $set: {
                        username: username,
                    },
                    $set: {
                        'login-history': loginHistory,
                    }
                }

                db.collection('configuration').updateOne(query, update, (err, res) => {
                    if (err) {
                        console.log(err);
                        return reject({ err: 'Failed to connect to database', status: 500 });
                    }

                    database.close();
                    return resolve(res);
                });

            })
        })
        .catch(err => {
            return reject(err);
        })
    });
}

const createConfig = (username) => {
    return new Promise((resolve, reject) => {

        generateSessionHash()
            .then(hash => {
                MongoClient.connect(url, (err, database) => {
                    if (err) {
                        return reject({ err: 'Failed to connect to database', status: 500 });
                    }

                    const db = database.db('OtaWilma');

                    const config = { ...{ username: username }, ...defaultConfig };
                    config['hash'] = hash;

                    db.collection('configuration').insertOne(config, (err, res) => {
                        if (err) {
                            console.log(err);
                            return reject({ err: 'Failed to connect to database', status: 500 });
                        }

                        database.close();
                        return resolve({ hash: hash });
                    });

                })
            })
            .catch(err => {
                console.log(err);
                return reject({ err: 'Failed to generate safe hash', status: 500 })
            })

    })
}

const getConfig = (hash) => {
    return new Promise((resolve, reject) => {
        MongoClient.connect(url, (err, database) => {
            if (err) return reject({ err: 'Failed to connect to database', status: 500 });

            const db = database.db('OtaWilma');

            const query = { hash: hash }

            db.collection('configuration').find(query).project({'_id': 0, 'login-history': 0, 'hash': 0}).toArray((err, res) => {
                if (err) return reject({ err: 'Failed to connect to database', status: 500 });

                database.close();

                if (res.length < 1) return reject({ err: "Couldn't locate configuration with specified hash", status: 400 });

                return resolve(res[0]);
            });
        })
    })
}


const getLoginHistory = (hash) => {
    return new Promise((resolve, reject) => {
        MongoClient.connect(url, (err, database) => {
            if (err) return reject({ err: 'Failed to connect to database', status: 500 });

            const db = database.db('OtaWilma');

            const query = { hash: hash }
            const projection = {
                '_id': 0,
                'username': 0,
                'frontpage': 0,
                'current-theme': 0,
                'themes': 0,
                'hash': 0
            }

            db.collection('configuration').find(query).project(projection).toArray((err, res) => {
                if (err) return reject({ err: 'Failed to connect to database', status: 500 });

                database.close();

                if (res.length < 1) return reject({ err: "Couldn't locate configuration with specified hash", status: 400 });

                return resolve(res[0]);
            });
        })
    })
}


const createTheme = (hash) => {
    return new Promise((resolve, reject) => {

        getConfig(hash)
            .then(config => {

                if (config.themes.length > 24) return reject({ err: 'Failed to create theme - maximium number of themes have been reached', status: 400 })

                MongoClient.connect(url, (err, database) => {
                    if (err) return reject({ err: 'Failed to connect to database', status: 500 });

                    const db = database.db('OtaWilma');

                    const theme = { ...defaultTheme };
                    theme['hash'] = generate();

                    const query = { hash: hash }
                    const values = { $push: { themes: theme['hash'] } }

                    db.collection('configuration').updateOne(query, values, (err, res) => {
                        if (err) return reject({ err: 'Failed to connect to database', status: 500 });

                        if (res.matchedCount < 1) {
                            database.close();
                            return reject({ err: "Couldn't locate configuration with specified hash", status: 400 })
                        };

                        db.collection('themes').insertOne(theme, (err, res) => {
                            if (err) return reject({ err: 'Failed to connect to database', status: 500 });

                            database.close();
                            return resolve({ hash: theme['hash'] });
                        });

                    });


                })
            })
            .catch(err => {
                return reject(err);
            })

    })
}

const getDefaultTheme = (id) => {
    return new Promise((resolve, reject) => {

        const themes = ['light', 'dark'];

        if (!themes.includes(id)) return reject({ err: "specified theme is not a a default theme", status: 400 })

        MongoClient.connect(url, (err, database) => {
            if (err) return reject({ err: 'Failed to connect to database', status: 500 });

            const db = database.db('OtaWilma');

            const query = { hash: id }

            db.collection('themes').find(query).toArray((err, res) => {
                if (err) return reject({ err: 'Failed to connect to database', status: 500 });

                database.close();

                if (res.length < 1) return reject({ err: "This theme doesn't exists anymore, as it is likely deleted", status: 400 });

                return resolve(res[0]);
            });
        })
    })
}

const getTheme = (hash, id) => {
    return new Promise((resolve, reject) => {
        getConfig(hash)
            .then(config => {
                const themes = [...config['themes'], ...['light', 'dark']];

                if (!themes.includes(id)) return reject({ err: "configuration doesn't have this theme", status: 400 })

                MongoClient.connect(url, (err, database) => {
                    if (err) return reject({ err: 'Failed to connect to database', status: 500 });

                    const db = database.db('OtaWilma');

                    const query = { hash: id }

                    db.collection('themes').find(query).toArray((err, res) => {
                        if (err) return reject({ err: 'Failed to connect to database', status: 500 });

                        database.close();

                        if (res.length < 1) return reject({ err: "This theme doesn't exists anymore, as it is likely deleted", status: 400 });

                        return resolve(res[0]);
                    });
                })
            })
            .catch(err => {
                return reject(err);
            })
    })
}

const listThemes = (hash) => {
    return new Promise((resolve, reject) => {

        getConfig(hash)
            .then(async (config) => {
                const themes = [...config['themes'], ...['light', 'dark']];

                return resolve(themes);

            })
            .catch(err => {
                return reject(err);
            })

    })
}

const setTheme = (hash, id, theme) => {
    return new Promise((resolve, reject) => {

        getConfig(hash)
            .then(config => {

                const themes = [...config['themes'], ...['light', 'dark']];

                if (!themes.includes(id)) return reject({ err: "configuration doesn't have this theme", status: 400 });

                MongoClient.connect(url, (err, database) => {
                    if (err) return reject({ err: 'Failed to connect to database', status: 500 });

                    const db = database.db('OtaWilma');

                    const query = { hash: hash }
                    const values = { $set: { 'current-theme': id } }

                    db.collection('configuration').updateOne(query, values, (err, res) => {
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

const removeTheme = (hash, id) => {
    return new Promise((resolve, reject) => {
        getConfig(hash)
            .then(config => {

                if (!config['themes'].includes(id)) return reject({ err: "configuration doesn't have this theme", status: 400 })

                MongoClient.connect(url, (err, database) => {
                    if (err) return reject({ err: 'Failed to connect to database', status: 500 });

                    const db = database.db('OtaWilma');

                    const query = { hash: id }

                    db.collection('themes').deleteOne(query, (err, res) => {
                        if (err) return reject({ err: 'Failed to connect to database', status: 500 });


                        if (res.deletedCount < 1) {
                            database.close();
                            return reject({ err: "Failed to locate and delete the theme", status: 400 });
                        }

                        const query = { hash: hash }
                        const values = config['current-theme'] == id ? { $pull: { themes: id }, $set: { 'current-theme': 'light' } } : { $pull: { themes: id } }

                        db.collection('configuration').updateOne(query, values, (err, res) => {
                            if (err) return reject({ err: 'Failed to connect to database', status: 500 });


                            if (res.modifiedCount < 1) return reject({ err: 'Failed to remove theme from the theme-list' });

                            database.close();
                            return resolve({ status: 200 });
                        });
                    });
                })
            })
            .catch(err => {
                return reject(err);
            })
    })
}
const editTheme = (hash, id, root, update = { key: String, value: String }) => {
    return new Promise((resolve, reject) => {
        getConfig(hash)
            .then(config => {
                if (!config['themes'].includes(id)) return reject({ err: "you cannot modify this theme", status: 400 });

                if (!Object.keys(defaultTheme[root]).includes(update.key)) {
                    return reject({ err: `"${update.key}" is not a valid field in "${root}"`, status: 400 });
                }

                MongoClient.connect(url, (err, database) => {
                    if (err) return reject({ err: 'Failed to connect to database', status: 500 });

                    const db = database.db('OtaWilma');

                    const value = {};

                    value[`${root}.${[update.key]}.value`] = update.value;

                    const query = { hash: id }
                    const values = { $set: value }

                    console.log(values);

                    db.collection('themes').updateOne(query, values, (err, res) => {
                        if (err) return reject({ err: 'Failed to connect to database', status: 500 });

                        database.close();

                        return resolve(res);
                    });
                })
            })
            .catch(err => {
                return reject(err);
            })
    })
}

const generateSessionHash = () => {
    return new Promise((resolve, reject) => {
        crypto.randomBytes(12, (err, buffer) => {
            if (err) {
                console.log(err);
                return reject(err);
            }

            return resolve(buffer.toString('hex'));
        });
    });
}

module.exports = {
    config: {
        login,
        createConfig,
        getConfig,
        getLoginHistory,
        setTheme
    },
    theme: {
        createTheme,
        getDefaultTheme,
        getTheme,
        listThemes,
        editTheme,
        removeTheme
    }
}