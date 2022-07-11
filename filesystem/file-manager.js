const path = require('path');
const fs = require('fs');
const shortid = require('shortid');
const crypto = require('crypto');

const { themes, config } = require('../config.json');
// const { defaultConfig, defaultTheme } = require('./default.json');


const setConfigTheme = (hash, theme) => {
    return new Promise((resolve, reject) => {
        const PATH = path.join(config.root, `${hash}.json`);

        getConfig(hash)
            .then(data => {
                const themes = data['themes'];
                const defaults = ['light', 'dark']

                if (!themes.includes(theme) && !defaults.includes(theme)) {
                    return reject({ err: `Couldn't update theme - "${theme}" doesn't exist`, status: 400 });
                }

                data['current-theme'] = theme;

                fs.writeFile(PATH, JSON.stringify(data), {}, (err) => {
                    if (err) {
                        console.log(err);
                        return reject({ err: 'failed to update your current theme', status: 500 })
                    }

                    return resolve({ success: true });
                })
            })
            .catch(err => {
                return reject(err);
            });
    });
}

const createTheme = (hash) => {
    return new Promise((resolve, reject) => {
        getConfig(hash)
            .then(data => {

                const id = shortid.generate();
                const themePath = path.join(themes.root, `${hash}.${id}.json`);
                const configPath = path.join(config.root, `${hash}.json`);


                data['themes'].push(id);

                fs.writeFile(themePath, JSON.stringify(defaultTheme), {}, (err) => {
                    if (err) {
                        console.log(err);
                        return reject({ err: 'failed to create theme file', status: 500 })
                    }

                    fs.writeFile(configPath, JSON.stringify(data), {}, (err) => {
                        if (err) {
                            console.log(err);
                            return reject({ err: 'failed to update config file', status: 500 })
                        }

                        return resolve(id);
                    })

                });
            })
            .catch(err => {
                return reject(err);
            });
    })
}

const getTheme = (hash, id) => {
    return new Promise((resolve, reject) => {
        const defaults = ['light', 'dark'];

        const PATH = defaults.includes(id) ? path.join(themes.defaults, `${id}.json`) : path.join(themes.root, `${hash}.${id}.json`);

        fs.readFile(PATH, {}, (err, buffer) => {
            if (err) {
                switch (err.code) {
                    case 'ENOENT':
                        return reject({ err: "Couldn't locate theme with specified hash", status: 401 });
                    default:
                        console.log(err);
                        return reject({ err: 'failed to read theme file', status: 500 })
                }
            }

            const data = JSON.parse(buffer);
            return resolve(data);
        });

    });
}

const listThemes = (hash) => {
    return new Promise((resolve, reject) => {
        const defaults = ['light', 'dark'];
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
        const list = [];

        getConfig(hash)
            .then(async (data) => {
                const current = data['current-theme'];
                const themes = defaults.concat(data['themes']);

                for (let i = 0; i < themes.length; i++) {
                    const id = themes[i];

                    const theme = await getTheme(hash, id).catch(err => {
                        return reject(err);
                    })

                    const preview = { id: id, default: defaults.includes(id), current: false }

                    fields.forEach(field => {
                        if (!preview[field.root]) { preview[field.root] = {}; }

                        preview[field.root][field.key] = theme[field.root][field.key];
                    });

                    if (id == current) { preview.current = true; }

                    list.push(preview);
                }

                return resolve(list);
            })
            .catch(err => {
                return reject(err);
            })
    });
}

const editTheme = (hash, id, root, update = { key: String, value: String }) => {
    return new Promise((resolve, reject) => {
        const PATH = path.join(themes.root, `${hash}.${id}.json`);

        getTheme(hash, id)
            .then(data => {
                const keys = Object.keys(data[root]);

                if (!keys.includes(update.key)) {
                    return reject({ err: `Theme file doesn't contain the field "${update.key}"`, status: 400 });
                }

                data[root][update.key] = update.value;
                console.log(data);

                fs.writeFile(PATH, JSON.stringify(data), {}, (err) => {
                    if (err) {
                        console.log(err);
                        return reject({ err: 'failed to update theme file', status: 500 })
                    }

                    return resolve({ success: true });
                })
            })
            .catch(err => {
                return reject(err);
            });
    });
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
    setConfigTheme,
    createTheme,
    getTheme,
    listThemes,
    editTheme
}
