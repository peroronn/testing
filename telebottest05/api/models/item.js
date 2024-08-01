const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
    _id: Number,
    itemname: String,
    itemqty: Number,
    alertqty: Number,
    expdate: String,
    subspaceid: Number
});

module.exports = mongoose.model('Item', itemSchema);
