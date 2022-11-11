const express = require('express');
const cors = require('cors');

const sessions = require('./routers/sessions');
const themes = require('./routers/themes');
const public = require('./routers/public-api');
const friends = require('./routers/friends');

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
app.use('/api', friends, limiter.standard);

// PORT
app.listen(PORT, () => {
    console.log(`Listening on ${PORT}...`);
});