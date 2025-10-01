const express = require('express');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/users/:username/status
router.get('/:username/status', auth, async (req, res) => {
	try {
		const { username } = req.params;
		const user = await User.findOne({ username }).select('username online lastLogoutAt').lean();
		if (!user) return res.status(404).json({ error: 'user not found' });
		return res.json(user);
	} catch (err) {
		console.error('GET /users/:username/status error:', err);
		return res.status(500).json({ error: 'Failed to fetch status' });
	}
});

module.exports = router; 