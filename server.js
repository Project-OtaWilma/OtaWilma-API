const express = require('express');
const cors = require('cors');

const shortid = require('shortid');

const sessions = require('./routers/sessions');
const themes = require('./routers/themes');

const app = express();
const PORT = process.env.PORT || 3000;


app.use(express.json());
app.use(cors());


// Routers
app.use('/api', sessions);
app.use('/api', themes);

// PORT
app.listen(PORT, () => {
    console.log(`Listening on ${PORT}...`);
});
