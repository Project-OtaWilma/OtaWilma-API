const { MongoClient } = require('mongodb');
const { user, password, host, port, authServer } = require('../secret.json');
const { defaultConfig, defaultThemes } = require('./default.json');
const { generate } = require('shortid');
const {} = require('./authentication');

const { config } = require('./user-schema');

const url = `mongodb://${user}:${password}@${host}:${port}/wilma?authMechanism=DEFAULT&authSource=${authServer}`;
//const url = `mongodb://127.0.0.1:27017`;

const createTheme = (auth, preset) => {
    return new Promise((resolve, reject) => {

        config.getConfig(auth)
            .then(config => {
                if (config.themes.length > 24) return reject({ err: 'Failed to create theme - maximium number of themes have been reached', status: 400 })

                MongoClient.connect(url, (err, database) => {
                    if (err) console.log(err);
                    if (err) return reject({ err: 'Failed to connect to database', status: 500 });

                    const db = database.db('OtaWilma');

                    const theme = { ...defaultThemes[preset] };
                    theme['hash'] = generate();

                    const query = { username: auth.username }
                    const values = { $push: { themes: theme['hash'] } }

                    db.collection('user-schema').updateOne(query, values, (err, res) => {
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

const getTheme = (auth, id) => {
    return new Promise((resolve, reject) => {
        config.getConfig(auth)
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

const listThemes = (auth) => {
    return new Promise((resolve, reject) => {

        config.getConfig(auth)
            .then(async (config) => {
                return resolve([...config['themes'], ...['light', 'dark']]);
            })
            .catch(err => {
                return reject(err);
            })

    })
}

const removeTheme = (auth, id) => {
    return new Promise((resolve, reject) => {
        getConfig(auth)
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

const editTheme = (auth, id, root, update = { key: String, value: String }) => {
    return new Promise((resolve, reject) => {
        config.getConfig(auth)
            .then(config => {
                if (!config['themes'].includes(id)) return reject({ err: "you cannot modify this theme", status: 400 });

                if (!Object.keys(defaultThemes['light'][root]).includes(update.key)) {
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

module.exports = {
    themes: {
        createTheme,
        getDefaultTheme,
        getTheme,
        listThemes,
        removeTheme,
        editTheme
    }
}