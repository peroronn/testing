const mongoose = require('mongoose');

const spaceSchema = new mongoose.Schema({
    _id: Number,
    spacename: String,
    user_id: Number // Ensure this matches the field you're sending from the bot
});

module.exports = mongoose.model('Space', spaceSchema);
