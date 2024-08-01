require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const spaceRoutes = require('./routes/space');
const subspaceRoutes = require('./routes/subspace');
const itemRoutes = require('./routes/item');

const app = express();
app.use(bodyParser.json());

mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log('Failed to connect to MongoDB', err));

app.use('/spaces', spaceRoutes);
app.use('/subspaces', subspaceRoutes);
app.use('/items', itemRoutes);

app.listen(5000, () => {
    console.log('Server is running on port 5000');
});
