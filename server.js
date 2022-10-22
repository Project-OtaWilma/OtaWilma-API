const express = require('express');
const cors = require('cors');

const sessions = require('./routers/sessions');
const themes = require('./routers/themes');

const limiter = require('./routers/rate-limit');

const { port } = require('./config.json');

const app = express();
const PORT = process.env.PORT || port;


app.use(express.json());
app.use(cors());


// Routers
app.use('/api', sessions, limiter.standard);
app.use('/api', themes, limiter.standard);

// PORT
app.listen(PORT, () => {
    console.log(`Listening on ${PORT}...`);
});