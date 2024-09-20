const express = require('express');
const { Server } = require('colyseus');
const { createServer } = require('http');
const { GameRoom } = require('./GameRoom'); // define the room

const app = express();
const gameServer = new Server({
    server: createServer(app),
});

// Register the room
gameServer.define('game_room', GameRoom);

// Start servr
gameServer.listen(2567);
console.log('Colyseus server is running on ws://localhost:2567');
