const express = require('express');
const router = express.Router();
const Space = require('../models/space');

// Get all spaces
router.get('/', async (req, res) => {
    try {
        const spaces = await Space.find();
        res.status(200).json(spaces);
    } catch (error) {
        console.error('Error retrieving spaces:', error);
        res.status(500).json({ error: 'Failed to retrieve spaces' });
    }
});

// Add a new space
router.post('/', async (req, res) => {
    const { name } = req.body;
    try {
        const newSpace = new Space({ name });
        await newSpace.save();
        res.status(201).json(newSpace);
    } catch (error) {
        console.error('Error adding space:', error);
        res.status(500).json({ error: 'Failed to add space' });
    }
});

// Get a specific space by ID
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const space = await Space.findById(id);
        if (!space) {
            return res.status(404).json({ error: 'Space not found' });
        }
        res.status(200).json(space);
    } catch (error) {
        console.error('Error retrieving space:', error);
        res.status(500).json({ error: 'Failed to retrieve space' });
    }
});

// Delete a space by ID
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const space = await Space.findByIdAndDelete(id);
        if (!space) {
            return res.status(404).json({ error: 'Space not found' });
        }
        res.status(200).json({ message: 'Space deleted successfully' });
    } catch (error) {
        console.error('Error deleting space:', error);
        res.status(500).json({ error: 'Failed to delete space' });
    }
});

router.post('/spaces', async (req, res) => {
    const { user_id, name } = req.body;
    try {
        const newSpace = new Space({ user_id, spacename: name }); 
        await newSpace.save();
        res.status(201).json(newSpace);
    } catch (error) {
        console.error('Error adding space:', error);
        res.status(500).json({ error: 'Failed to add space' });
    }
});


// Get all spaces
router.get('/spaces', async (req, res) => {
    try {
        const spaces = await Space.find();
        res.status(200).json(spaces);
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve spaces' });
    }
});

module.exports = router;
