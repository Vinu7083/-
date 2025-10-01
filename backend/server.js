require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const mongoose = require('mongoose');
const { Server } = require('socket.io');

const messagesRouter = require('./routes/messages');
const authRouter = require('./routes/auth');
const usersRouter = require('./routes/users');

const app = express();
const server = http.createServer(app);

const clientOrigin = 'https://12-rzuy.onrender.com';

const io = new Server(server, {
	cors: {
		origin: clientOrigin,
		methods: ['GET', 'POST'],
	},
	pingTimeout: 30000,
	pingInterval: 10000,
});

app.set('io', io);

app.use(cors({ origin: clientOrigin, credentials: true }));
app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/messages', messagesRouter);
app.use('/api/users', usersRouter);

io.on('connection', (socket) => {
	console.log('Socket connected:', socket.id);

	socket.on('disconnect', () => {
		console.log('Socket disconnected:', socket.id);
	});
});

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || '';

async function start() {
	try {
		if (!MONGODB_URI) {
			throw new Error('MONGODB_URI is not set');
		}
		await mongoose.connect(MONGODB_URI, {
			serverSelectionTimeoutMS: 10000,
		});
		console.log('Connected to MongoDB');

		server.listen(PORT, () => {
			console.log(`Server listening on port ${PORT}`);
		});
	} catch (err) {
		console.error('Failed to start server:', err.message);
		process.exit(1);
	}
}

start(); 