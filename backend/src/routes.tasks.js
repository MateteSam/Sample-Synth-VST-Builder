const express = require('express');
const { readTasks, writeTasks } = require('../src/store');

const router = express.Router();

router.get('/', (req, res, next) => {
  try {
    const tasks = readTasks();
    res.json(tasks);
  } catch (e) { next(e); }
});

router.post('/', (req, res, next) => {
  try {
    const { title } = req.body || {};
    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }
    const tasks = readTasks();
    const newTask = { id: `${Date.now()}-${Math.floor(Math.random() * 1e6)}`, title: title.trim(), completed: false };
    tasks.push(newTask);
    writeTasks(tasks);
    res.status(201).json(newTask);
  } catch (e) { next(e); }
});

router.put('/:id', (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, completed } = req.body || {};
    const tasks = readTasks();
    const idx = tasks.findIndex((t) => t.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Not found' });
    if (typeof title === 'string') tasks[idx].title = title.trim();
    if (typeof completed === 'boolean') tasks[idx].completed = completed;
    writeTasks(tasks);
    res.json(tasks[idx]);
  } catch (e) { next(e); }
});

router.delete('/:id', (req, res, next) => {
  try {
    const { id } = req.params;
    const tasks = readTasks();
    const nextTasks = tasks.filter((t) => t.id !== id);
    if (nextTasks.length === tasks.length) return res.status(404).json({ error: 'Not found' });
    writeTasks(nextTasks);
    res.json({ success: true });
  } catch (e) { next(e); }
});

router.delete('/completed', (req, res, next) => {
  try {
    const tasks = readTasks();
    const remaining = tasks.filter((t) => !t.completed);
    const removed = tasks.length - remaining.length;
    writeTasks(remaining);
    res.json({ success: true, removed });
  } catch (e) { next(e); }
});

module.exports = router;
