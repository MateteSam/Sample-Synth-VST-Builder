const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const {
  readSamples,
  writeSamples,
  parseNoteFromFilename,
  parseVelocityFromFilename,
  parseRoundRobinFromFilename,
  parseMicFromFilename,
} = require('../src/store');
const { uploadDir } = require('../src/constants');

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9_\-.]/g, '_');
    const unique = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
    cb(null, `${unique}-${safeName}`);
  },
});
const upload = multer({ storage });

const router = express.Router();

router.get('/', (req, res, next) => {
  try { res.json(readSamples()); } catch (e) { next(e); }
});

router.post('/upload', upload.array('files'), (req, res, next) => {
  try {
    const samples = readSamples();
    const created = [];
    for (const file of req.files || []) {
      const id = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
      const rootMidi = parseNoteFromFilename(file.originalname) ?? 60;
      const vel = parseVelocityFromFilename(file.originalname);
      const rrIndex = parseRoundRobinFromFilename(file.originalname) ?? 1;
      const mic = parseMicFromFilename(file.originalname) || null;
      const entry = {
        id,
        name: file.originalname,
        filename: file.filename,
        url: `/uploads/${file.filename}`,
        rootMidi,
        noteLow: 0,
        noteHigh: 127,
        velLow: vel?.velLow ?? 0,
        velHigh: vel?.velHigh ?? 127,
        rrIndex,
        mic,
      };
      samples.push(entry);
      created.push(entry);
    }
    writeSamples(samples);
    res.status(201).json({ samples: created });
  } catch (e) { next(e); }
});

router.delete('/:id', (req, res, next) => {
  try {
    const samples = readSamples();
    const idx = samples.findIndex((s) => s.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Not found' });
    const [removed] = samples.splice(idx, 1);
    writeSamples(samples);
    const filePath = path.join(uploadDir, removed.filename);
    if (fs.existsSync(filePath)) fs.unlink(filePath, () => {});
    res.json({ success: true });
  } catch (e) { next(e); }
});

router.delete('/', (req, res, next) => {
  try {
    const samples = readSamples();
    let removed = 0;
    for (const s of samples) {
      const filePath = s.filename ? path.join(uploadDir, s.filename) : null;
      if (filePath && fs.existsSync(filePath)) { try { fs.unlinkSync(filePath); } catch {} }
      removed++;
    }
    writeSamples([]);
    res.json({ success: true, removed });
  } catch (e) { next(e); }
});

module.exports = router;
