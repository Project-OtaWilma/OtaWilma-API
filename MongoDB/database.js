const crypto = require('crypto');
const { MongoClient } = require('mongodb');
const { url } = require('./config.json');
const { defaultConfig, defaultTheme } = require('./default.json');
const { generate } = require('shortid');
const { resolve } = require('path');

const createConfig = () => {
    return new Promise((resolve, reject) => {

        generateSessionHash()
            .then(hash => {
                MongoClient.connect(url, (err, database) => {
                    if (err) return reject({ err: 'Failed to connect to database', status: 500 });

                    const db = database.db('OtaWilma');

                    const config = { ...defaultConfig };
                    config['hash'] = hash;

                    db.collection('configuration').insertOne(config, (err, res) => {
                        if (err) return reject({ err: 'Failed to connect to database', status: 500 });

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

            db.collection('configuration').find(query).toArray((err, res) => {
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
        const fields =
            [
                { root: 'colors', key: '--accent-main' },
                { root: 'colors', key: '--background-main' },
                { root: 'colors', key: '--background-darker' },
                { root: 'colors', key: '--font-h1' },
                { root: 'colors', key: '--font-h2' },
                { root: 'colors', key: '--font-h3' },
                { root: 'colors', key: '--shadow-main' },
                { root: 'background', key: 'url' },
                { root: 'background', key: 'blur' },
                { root: 'background', key: 'opacity' },
                { root: 'background', key: 'brightness' },
                { root: 'background', key: 'contrast' },
                { root: 'background', key: 'saturate' },
                { root: 'background', key: 'grayscale' },
                { root: 'background', key: 'sepia' },
                { root: 'background', key: 'sepia' },
                { root: 'background', key: 'hue-rotate' },
                { root: 'background', key: 'invert' },
            ]

        getConfig(hash)
            .then(async (config) => {
                const result = {};
                for (let i = 0; i < config['themes'].length; i++) {
                    const id = config['themes'][i];

                    const theme = await getTheme(hash, id)
                        .catch(err => {
                            return reject(err);
                        })

                    result[id] = {};

                    fields.forEach(field => {
                        result[id][field.key] = theme[field.root][field.key];
                    })
                }

                return resolve(result);
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

                if (!config['themes']) return reject({ err: "configuration doesn't have this theme", status: 400 })

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

                        if (res.modifiedCount < 1) return reject({ err: "Failed to modify key-value pair", status: 400 });

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
        createConfig,
        getConfig,
        setTheme
    },
    theme: {
        createTheme,
        getTheme,
        listThemes,
        editTheme,
        removeTheme
    }
}