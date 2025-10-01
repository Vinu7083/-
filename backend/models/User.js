const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema(
	{
		username: { type: String, required: true, unique: true, trim: true },
		passwordHash: { type: String, required: true },
		online: { type: Boolean, default: false },
		lastLogoutAt: { type: Date, default: null },
	},
	{ timestamps: true, versionKey: false }
);

UserSchema.methods.comparePassword = async function (password) {
	return bcrypt.compare(password, this.passwordHash);
};

module.exports = mongoose.model('User', UserSchema); 