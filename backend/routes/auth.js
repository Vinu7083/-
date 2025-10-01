const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Passkey = require('../models/Passkey');
const auth = require('../middleware/auth');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';
const JWT_EXPIRES_IN = '7d';

router.post('/register', async (req, res) => {
	try {
		let { username, password, passkey } = req.body;
		username = typeof username === 'string' ? username.trim() : '';
		passkey = typeof passkey === 'string' ? passkey.trim() : '';
		if (!username || !password || !passkey) {
			return res.status(400).json({ error: 'username, password and passkey are required' });
		}
		const existing = await User.findOne({ username });
		if (existing) {
			return res.status(409).json({ error: 'username already exists' });
		}
		const pk = await Passkey.findOne({ key: passkey, active: true }).lean();
		if (!pk) {
			return res.status(403).json({ error: 'invalid passkey' });
		}
		if (pk.singleUse) {
			await Passkey.updateOne({ _id: pk._id }, { $set: { active: false, consumedAt: new Date() } });
		}
		const passwordHash = await bcrypt.hash(password, 10);
		const user = await User.create({ username, passwordHash });
		return res.status(201).json({ id: user._id, username: user.username });
	} catch (err) {
		console.error('POST /auth/register error:', err);
		return res.status(500).json({ error: 'Failed to register' });
	}
});

router.post('/login', async (req, res) => {
	try {
		const { username, password } = req.body;
		if (!username || !password) {
			return res.status(400).json({ error: 'username and password are required' });
		}
		const user = await User.findOne({ username });
		if (!user) {
			return res.status(401).json({ error: 'invalid credentials' });
		}
		const ok = await user.comparePassword(password);
		if (!ok) {
			return res.status(401).json({ error: 'invalid credentials' });
		}
		await User.updateOne({ _id: user._id }, { $set: { online: true } });
		const token = jwt.sign({ sub: user._id.toString(), username: user.username }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
		return res.json({ token, user: { id: user._id, username: user.username } });
	} catch (err) {
		console.error('POST /auth/login error:', err);
		return res.status(500).json({ error: 'Failed to login' });
	}
});

router.post('/logout', auth, async (req, res) => {
	try {
		const now = new Date();
		await User.updateOne({ _id: req.user.id }, { $set: { online: false, lastLogoutAt: now } });
		return res.json({ ok: true, at: now.toISOString() });
	} catch (err) {
		console.error('POST /auth/logout error:', err);
		return res.status(500).json({ error: 'Failed to logout' });
	}
});

module.exports = router; 