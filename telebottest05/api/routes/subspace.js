const express = require('express');
const router = express.Router();
const Subspace = require('../models/subspace');

// Get all subspaces for a specific space ID
router.get('/:spaceId', async (req, res) => {
    const { spaceId } = req.params;
    try {
        const subspaces = await Subspace.find({ spaceid: spaceId });
        res.status(200).json(subspaces);
    } catch (error) {
        console.error('Error retrieving subspaces:', error);
        res.status(500).json({ error: 'Failed to retrieve subspaces' });
    }
});

// Add a new subspace
router.post('/', async (req, res) => {
    const { spaceid, name } = req.body;
    try {
        const newSubspace = new Subspace({ spaceid, name });
        await newSubspace.save();
        res.status(201).json(newSubspace);
    } catch (error) {
        console.error('Error adding subspace:', error);
        res.status(500).json({ error: 'Failed to add subspace' });
    }
});

// Get a specific subspace by ID
router.get('/subspace/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const subspace = await Subspace.findById(id);
        if (!subspace) {
            return res.status(404).json({ error: 'Subspace not found' });
        }
        res.status(200).json(subspace);
    } catch (error) {
        console.error('Error retrieving subspace:', error);
        res.status(500).json({ error: 'Failed to retrieve subspace' });
    }
});

// Delete a subspace by ID
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const subspace = await Subspace.findByIdAndDelete(id);
        if (!subspace) {
            return res.status(404).json({ error: 'Subspace not found' });
        }
        res.status(200).json({ message: 'Subspace deleted successfully' });
    } catch (error) {
        console.error('Error deleting subspace:', error);
        res.status(500).json({ error: 'Failed to delete subspace' });
    }
});

module.exports = router;
