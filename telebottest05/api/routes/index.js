const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
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

module.exports = router;
