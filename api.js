const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

// Initialize the app
const app = express();
app.use(bodyParser.json());

// MongoDB connection

const mongoUri = 'mongodb+srv://testing02:testing02@testing.6l9zuga.mongodb.net/?retryWrites=true&w=majority&appName=testing';

mongoose.connect(mongoUri, {  // Use the correct variable name
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('MongoDB connected');
}).catch(err => {
    console.log('Failed to connect to MongoDB', err);
});

// Define models
const counterSchema = new mongoose.Schema({
    _id: String,
    sequence_value: Number
});
const Counter = mongoose.model('Counter', counterSchema);

const spaceSchema = new mongoose.Schema({
    _id: Number,
    spacename: String,
    userid: Number
});
const Space = mongoose.model('Space', spaceSchema);

const subspaceSchema = new mongoose.Schema({
    _id: Number,
    subspacename: String,
    spaceid: Number
});
const Subspace = mongoose.model('Subspace', subspaceSchema);

const itemSchema = new mongoose.Schema({
    _id: Number,
    itemname: String,
    itemqty: Number,
    alertqty: Number,
    expdate: String,
    subspaceid: Number
});
const Item = mongoose.model('Item', itemSchema);

// Function to get the next sequence value
const getNextSequenceValue = async (sequenceName) => {
    const sequenceDocument = await Counter.findOneAndUpdate(
        { _id: sequenceName },
        { $inc: { sequence_value: 1 } },
        { new: true, upsert: true }
    );
    return sequenceDocument.sequence_value;
};

// Add space
app.post('/add_space', async (req, res) => {
    const { user_id, spacename } = req.body;
    const space_id = await getNextSequenceValue('spaceid');
    const space = new Space({ _id: space_id, spacename, userid: user_id });
    await space.save();
    res.status(200).json({ message: `Space '${spacename}' added with ID ${space_id}` });
});

// Add subspace
app.post('/add_subspace', async (req, res) => {
    const { space_id, subspacename } = req.body;
    const subspace_id = await getNextSequenceValue('subspaceid');
    const subspace = new Subspace({ _id: subspace_id, subspacename, spaceid: space_id });
    await subspace.save();
    res.status(200).json({ message: `Subspace '${subspacename}' added with ID ${subspace_id}` });
});

// Add item
app.post('/add_item', async (req, res) => {
    const { subspace_id, itemname, itemqty, alertqty, expdate } = req.body;
    const item_id = await getNextSequenceValue('itemid');
    const item = new Item({ _id: item_id, itemname, itemqty, alertqty, expdate, subspaceid: subspace_id });
    await item.save();
    res.status(200).json({ message: `Item '${itemname}' added with ID ${item_id}` });
});

// View all data
// View all data
app.get('/view', async (req, res) => {
    const allData = [];
    const spaces = await Space.find();
    for (const space of spaces) {
        const subspaces = await Subspace.find({ spaceid: space._id });
        for (const subspace of subspaces) {
            const items = await Item.find({ subspaceid: subspace._id });
            for (const item of items) {
                allData.push({
                    space_name: space.spacename,
                    subspace_name: subspace.subspacename,
                    item_name: item.itemname,
                    item_qty: item.itemqty,
                    alert_qty: item.alertqty,
                    exp_date: item.expdate
                });
            }
        }
    }
    res.status(200).json(allData);
});

// Get all spaces
app.get('/spaces', async (req, res) => {
    try {
        const spaces = await Space.find();
        res.status(200).json(spaces);
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve spaces' });
    }
});

// Get all subspaces by space ID
app.get('/subspaces/:spaceId', async (req, res) => {
    const spaceId = req.params.spaceId;
    try {
        const subspaces = await Subspace.find({ spaceid: spaceId });
        res.status(200).json(subspaces);
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve subspaces' });
    }
});

// Get all items by subspace ID
app.get('/items/:subspaceId', async (req, res) => {
    const subspaceId = req.params.subspaceId;
    try {
        const items = await Item.find({ subspaceid: subspaceId });
        res.status(200).json(items);
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve items' });
    }
});




// Delete space
app.delete('/delete_space/:id', async (req, res) => {
    const spaceId = req.params.id;
    try {
        await Item.deleteMany({ subspaceid: { $in: (await Subspace.find({ spaceid: spaceId })).map(s => s._id) } });
        await Subspace.deleteMany({ spaceid: spaceId });
        await Space.findByIdAndDelete(spaceId);
        res.status(200).json({ message: `Space and all related data deleted successfully.` });
    } catch (err) {
        res.status(500).json({ message: 'Failed to delete space.', error: err.message });
    }
});

// Delete subspace
app.delete('/delete_subspace/:id', async (req, res) => {
    const subspaceId = req.params.id;
    try {
        await Item.deleteMany({ subspaceid: subspaceId });
        await Subspace.findByIdAndDelete(subspaceId);
        res.status(200).json({ message: `Subspace and all related items deleted successfully.` });
    } catch (err) {
        res.status(500).json({ message: 'Failed to delete subspace.', error: err.message });
    }
});

// Delete item
app.delete('/delete_item/:id', async (req, res) => {
    const itemId = req.params.id;
    try {
        await Item.findByIdAndDelete(itemId);
        res.status(200).json({ message: `Item deleted successfully.` });
    } catch (err) {
        res.status(500).json({ message: 'Failed to delete item.', error: err.message });
    }
});


// Start the server
app.listen(5000, () => {
    console.log('Server is running on port 5000');
});
