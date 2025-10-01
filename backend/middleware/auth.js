const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';

module.exports = async function auth(req, res, next) {
	try {
		const authHeader = req.headers.authorization || '';
		const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
		if (!token) {
			return res.status(401).json({ error: 'missing token' });
		}
		const payload = jwt.verify(token, JWT_SECRET);
		const user = await User.findById(payload.sub).lean();
		if (!user) {
			return res.status(401).json({ error: 'invalid token' });
		}
		req.user = { id: user._id.toString(), username: user.username };
		return next();
	} catch (err) {
		return res.status(401).json({ error: 'unauthorized' });
	}
}; 