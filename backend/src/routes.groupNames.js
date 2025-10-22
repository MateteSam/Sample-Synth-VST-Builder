const express = require('express');
const { readGroupNames, writeGroupNames } = require('../src/store');

const router = express.Router();

router.get('/', (req, res, next) => {
  try { res.json({ groupNames: readGroupNames() }); } catch (e) { next(e); }
});

router.put('/', (req, res, next) => {
  try {
    const { groupNames } = req.body || {};
    if (!groupNames || typeof groupNames !== 'object') return res.status(400).json({ error: 'groupNames object is required' });
    writeGroupNames(groupNames);
    res.json({ success: true, groupNames });
  } catch (e) { next(e); }
});

router.delete('/', (req, res, next) => {
  try { writeGroupNames({}); res.json({ success: true }); } catch (e) { next(e); }
});

module.exports = router;
