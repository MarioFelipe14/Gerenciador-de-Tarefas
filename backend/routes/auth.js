const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { getDB, saveDB } = require('../database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.post('/register', [
    body('email').isEmail(),
    body('password').isLength({ min: 6 }),
    body('name').notEmpty()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password, name } = req.body;
    const db = getDB();

    try {
        // Check if user exists
        const stmt = db.prepare('SELECT id FROM users WHERE email = ?');
        stmt.bind([email]);
        if (stmt.step()) {
            return res.status(400).json({ error: 'Email already in use' });
        }
        stmt.free();

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        db.run('INSERT INTO users (email, password, name) VALUES (?, ?, ?)', [email, hash, name]);
        saveDB();
        res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/login', [
    body('email').isEmail(),
    body('password').exists()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;
    const db = getDB();

    try {
        const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
        stmt.bind([email]);
        if (!stmt.step()) return res.status(400).json({ error: 'Invalid email or password' });

        const user = stmt.getAsObject();
        stmt.free();

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(400).json({ error: 'Invalid email or password' });

        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'supersecret', { expiresIn: '1h' });
        res.json({ token });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

router.get('/me', authMiddleware, (req, res) => {
    const db = getDB();
    const stmt = db.prepare('SELECT id, email, name FROM users WHERE id = ?');
    stmt.bind([req.user.id]);

    if (stmt.step()) {
        res.json(stmt.getAsObject());
    } else {
        res.status(404).json({ error: 'User not found' });
    }
    stmt.free();
});

module.exports = router;
