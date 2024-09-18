const { Room } = require('colyseus');
const { Schema, MapSchema, defineTypes } = require('@colyseus/schema');



// Define Player schema
class Player extends Schema {
    constructor() {
        super();
        this.x = 750;
        this.y = 450;
        this.position = 0;
    }
}

defineTypes(Player, {
    x: "number",
    y: "number",
    position: "number"
});

class State extends Schema {
    constructor() {
        super();
        this.players = new MapSchema();
    }
}

defineTypes(State, {
    players: { map: Player }
});

// Exporting for use in GameRoom
exports.Player = Player;
exports.State = State;


// GameRoom class definition
exports.GameRoom = class GameRoom extends Room {
    onCreate(options) {
        // initialize empty room state
        this.setState(new State());

        // Called every time this room receives a "rollDice" message
        this.onMessage('rollDice', (client) => {
            const diceValue = Math.floor(Math.random() * 6) + 1;
            const player = this.state.players.get(client.sessionId);

            if (player) {
                // Update player's position
                const moveDistance = diceValue * 0.05;
                player.position += moveDistance;
                if (player.position > 1) {
                    player.position = 1;
                    console.log(`Player ${client.sessionId} reached the end!`);
                    // Send a message to the client that the player has reached the end
                    this.broadcast('end', { id: client.sessionId });
                }

                console.log(`Player ${client.sessionId} rolled ${diceValue} and moved to position ${player.position}`);
                console.log(`Broadcasting update: { id: ${client.sessionId}, diceValue: ${diceValue}, position: ${player.position} }`);
                // Broadcast movement to all clients
                this.broadcast('update', { id: client.sessionId, diceValue, position: player.position });
            }
        });

    }

    onJoin(client) {
        console.log(`Player ${client.sessionId} joined`);

        // Add a new player to the state
        const newPlayer = new Player();
        this.state.players.set(client.sessionId, newPlayer);
        console.log('State after adding player:', this.state.players);
        /*
                // Trigger state change manually !!!!!!!
                this.state.players.triggerAll();
        
                */

        // DEBUG
        console.log(`Player added to state: ${client.sessionId}`, this.state.players.get(client.sessionId));

        // Log current state of players
        console.log('Current players in state:', this.state.players);
    }

    onLeave(client) {
        console.log(`Player ${client.sessionId} left`);
        this.state.players.delete(client.sessionId);
    }
};

