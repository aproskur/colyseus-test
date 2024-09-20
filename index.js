const express = require('express');
const cors = require('cors');
const { Server } = require('colyseus');
const { createServer } = require('http');
const path = require('path');
const { GameRoom } = require('./GameRoom');

require('dotenv').config();

const app = express();
const gameServer = new Server({
    server: createServer(app),
});

// CORS setup
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3005';
app.use(cors({
    origin: FRONTEND_URL,
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
}));

// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'build')));
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Register the room
gameServer.define('game_room', GameRoom);

// Start server
const PORT = process.env.PORT || 2567;
gameServer.listen(PORT);
console.log(`Colyseus server is running on ws://your-public-ip-or-domain:${PORT}`);
