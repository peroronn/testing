const express = require('express');
const Item = require('../models/item');
const Counter = require('../models/counter');

const router = express.Router();

const getNextSequenceValue = async (sequenceName) => {
    const sequenceDocument = await Counter.findOneAndUpdate(
        { _id: sequenceName },
        { $inc: { sequence_value: 1 } },
        { new: true, upsert: true }
    );
    return sequenceDocument.sequence_value;
};

router.post('/add_item', async (req, res) => {
    const { subspace_id, itemname, itemqty, alertqty, expdate } = req.body;
    const item_id = await getNextSequenceValue('itemid');
    const item = new Item({ _id: item_id, itemname, itemqty, alertqty, expdate, subspaceid: subspace_id });
    await item.save();
    res.status(200).json({ message: `Item '${itemname}' added with ID ${item_id}` });
});

router.get('/', async (req, res) => {
    try {
        const items = await Item.find();
        res.status(200).json(items);
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve items' });
    }
});

router.delete('/delete_item/:id', async (req, res) => {
    const itemId = req.params.id;
    try {
        await Item.findByIdAndDelete(itemId);
        res.status(200).json({ message: 'Item deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete item' });
    }
});
router.post('/items', async (req, res) => {
    try {
        const { subspaceid, name, qty, alertqty, expdate } = req.body;
        const newItem = new Item({ subspaceid, name, qty, alertqty, expdate });
        await newItem.save();
        res.status(201).json(newItem);
    } catch (error) {
        res.status(500).json({ error: 'Failed to add item' });
    }
});

// Get all items for a subspace
router.get('/items/:subspaceid', async (req, res) => {
    try {
        const items = await Item.find({ subspaceid: req.params.subspaceid });
        res.status(200).json(items);
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve items' });
    }
});
module.exports = router;
