const express = require('express');
const { body, validationResult } = require('express-validator');
const { getDB, saveDB } = require('../database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// Get all tasks
router.get('/', (req, res) => {
    const db = getDB();
    try {
        const stmt = db.prepare('SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at DESC');
        stmt.bind([req.user.id]);

        const tasks = [];
        while (stmt.step()) {
            tasks.push(stmt.getAsObject());
        }
        stmt.free();

        res.json(tasks);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Create task
router.post('/', [
    body('title').notEmpty(),
    body('status').optional().isIn(['pending', 'in_progress', 'done']),
    body('priority').optional().isIn(['low', 'medium', 'high'])
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { title, description = '', status = 'pending', priority = 'medium' } = req.body;
    const db = getDB();

    try {
        db.run(
            'INSERT INTO tasks (user_id, title, description, status, priority) VALUES (?, ?, ?, ?, ?)',
            [req.user.id, title, description, status, priority]
        );
        saveDB();

        const taskId = db.exec("SELECT last_insert_rowid() as id")[0].values[0][0];

        const stmt = db.prepare('SELECT * FROM tasks WHERE id = ?');
        stmt.bind([taskId]);
        stmt.step();
        const newTask = stmt.getAsObject();
        stmt.free();

        res.status(201).json(newTask);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Update task
router.put('/:id', [
    body('status').optional().isIn(['pending', 'in_progress', 'done']),
    body('priority').optional().isIn(['low', 'medium', 'high'])
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { title, description, status, priority } = req.body;
    const taskId = req.params.id;
    const db = getDB();

    try {
        const stmt = db.prepare('SELECT * FROM tasks WHERE id = ? AND user_id = ?');
        stmt.bind([taskId, req.user.id]);
        if (!stmt.step()) return res.status(404).json({ error: 'Task not found' });

        const existingTask = stmt.getAsObject();
        stmt.free();

        const updatedTitle = title !== undefined ? title : existingTask.title;
        const updatedDesc = description !== undefined ? description : existingTask.description;
        const updatedStatus = status !== undefined ? status : existingTask.status;
        const updatedPriority = priority !== undefined ? priority : existingTask.priority;

        db.run(
            'UPDATE tasks SET title = ?, description = ?, status = ?, priority = ? WHERE id = ?',
            [updatedTitle, updatedDesc, updatedStatus, updatedPriority, taskId]
        );
        saveDB();

        const finalStmt = db.prepare('SELECT * FROM tasks WHERE id = ?');
        finalStmt.bind([taskId]);
        finalStmt.step();
        const finalTask = finalStmt.getAsObject();
        finalStmt.free();

        res.json(finalTask);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete task
router.delete('/:id', (req, res) => {
    const db = getDB();
    const taskId = req.params.id;

    try {
        const stmt = db.prepare('SELECT * FROM tasks WHERE id = ? AND user_id = ?');
        stmt.bind([taskId, req.user.id]);
        if (!stmt.step()) return res.status(404).json({ error: 'Task not found' });
        stmt.free();

        db.run('DELETE FROM tasks WHERE id = ?', [taskId]);
        saveDB();

        res.json({ message: 'Task deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
