const express = require('express');
const Message = require('../models/Message');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/messages
// Optional query: sender, receiver to filter conversation
router.get('/', auth, async (req, res) => {
	try {
		const { sender, receiver } = req.query;
		const filter = {};
		// Only allow fetching conversations involving the authenticated user
		const current = req.user.username;
		if (sender && receiver) {
			if (!(sender === current || receiver === current)) {
				return res.status(403).json({ error: 'forbidden' });
			}
			filter.$or = [
				{ sender, receiver },
				{ sender: receiver, receiver: sender },
			];
		} else {
			filter.$or = [{ sender: current }, { receiver: current }];
		}
		const messages = await Message.find(filter).sort({ timestamp: 1 });
		res.json(messages);
	} catch (err) {
		console.error('GET /messages error:', err);
		res.status(500).json({ error: 'Failed to fetch messages' });
	}
});

// POST /api/messages
router.post('/', auth, async (req, res) => {
	try {
		const { sender, receiver, message } = req.body;
		if (!sender || !receiver || !message) {
			return res.status(400).json({ error: 'sender, receiver, and message are required' });
		}
		// Enforce sender is the authenticated user
		if (sender !== req.user.username) {
			return res.status(403).json({ error: 'sender mismatch' });
		}
		// Ensure receiver exists
		const receiverUser = await User.findOne({ username: receiver });
		if (!receiverUser) {
			return res.status(400).json({ error: 'receiver does not exist' });
		}
		const newMessage = new Message({ sender, receiver, message });
		const saved = await newMessage.save();

		// Emit real-time event
		const io = req.app.get('io');
		io.emit('new_message', saved);

		res.status(201).json(saved);
	} catch (err) {
		console.error('POST /messages error:', err);
		res.status(500).json({ error: 'Failed to post message' });
	}
});

// DELETE /api/messages
// Body or query: sender, receiver
router.delete('/', auth, async (req, res) => {
	try {
		const sender = req.body?.sender || req.query?.sender;
		const receiver = req.body?.receiver || req.query?.receiver;
		if (!sender || !receiver) {
			return res.status(400).json({ error: 'sender and receiver are required' });
		}
		// Only allow clearing if the authenticated user is one of the participants
		const current = req.user.username;
		if (!(sender === current || receiver === current)) {
			return res.status(403).json({ error: 'forbidden' });
		}
		const result = await Message.deleteMany({
			$or: [
				{ sender, receiver },
				{ sender: receiver, receiver: sender },
			],
		});

		// Emit clear event so both parties update
		const io = req.app.get('io');
		io.emit('chat_cleared', { sender, receiver, deletedCount: result.deletedCount });

		return res.json({ ok: true, deleted: result.deletedCount });
	} catch (err) {
		console.error('DELETE /messages error:', err);
		return res.status(500).json({ error: 'Failed to clear messages' });
	}
});

module.exports = router; 