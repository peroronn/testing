const mongoose = require('mongoose');

const subspaceSchema = new mongoose.Schema({
    _id: Number,
    subspacename: String,
    spaceid: Number
});

module.exports = mongoose.model('Subspace', subspaceSchema);
