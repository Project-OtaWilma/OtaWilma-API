const express = require('express');
const cors = require('cors');
const { user, password, host, port, authServer } = require('../secret.json');
const url = `mongodb://${user}:${password}@${host}:${port}/?authMechanism=DEFAULT&authSource=${authServer}`;

const sessions = require('./routers/sessions');
const themes = require('./routers/themes');
const public = require('./routers/public-api');
const statistics = require('./routers/statistics');

const limiter = require('./routers/rate-limit');

const { port } = require('./config.json');

const app = express();
const PORT = process.env.PORT || port;


app.use(express.json());
app.use(cors());


// Routers
app.use('/api', sessions, limiter.standard);
app.use('/api', themes, limiter.standard);
app.use('/api', public, limiter.standard);
app.use('/api', statistics);

// PORT
app.listen(PORT, () => {
    console.log(`Listening on ${PORT}...`);
    console.log(`MongoDB connection on: ${url}`)
});