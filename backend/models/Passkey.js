const mongoose = require('mongoose');

const PasskeySchema = new mongoose.Schema(
	{
		key: { type: String, required: true, unique: true, trim: true },
		label: { type: String, default: '' },
		active: { type: Boolean, default: true },
		// If you want one-time use, set singleUse=true and consumeOnUse=true
		singleUse: { type: Boolean, default: false },
		consumedAt: { type: Date, default: null },
	},
	{ timestamps: true, versionKey: false }
);

module.exports = mongoose.model('Passkey', PasskeySchema); 