const colyseus = require('colyseus');
const schema = require('@colyseus/schema');

// An abstract player object, demonstrating a potential 2D world position
exports.Player = class Player extends schema.Schema {
    constructor() {
        super();
        this.x = 750;
        this.y = 450;
        this.position = 0;
        this.spriteType = "default";
        console.log(`New Player created with initial position: ${this.position}`); // DEBUG
    }
}


// schema to define the structure for each player, specifying fields 
//This schema tells Colyseus how to synchronize the state of individual players across clients.
schema.defineTypes(exports.Player, {
    x: "number",
    y: "number",
    position: "number",
    spriteType: "string"
});

// Custom game state, an ArraySchema of type Player only at the moment

exports.State = class State extends schema.Schema {
    constructor() {
        super();
        this.players = new schema.MapSchema();
    }
}

// STATE SCHEMA
// To tell Colyseus how to synchronize the state of individual players across clients
schema.defineTypes(exports.State, {
    players: { map: exports.Player }
});

exports.GameRoom = class GameRoom extends colyseus.Room {
    // Colyseus will invoke when creating the room instance
    onCreate(options) {
        // initialize empty room state
        this.maxClients = 2;
        this.setState(new exports.State()); // Reference the State class correctly



        // Called every time this room receives a "rollDice" message
        this.onMessage("rollDice", (client) => {
            const diceValue = Math.floor(Math.random() * 6) + 1;
            const player = this.state.players.get(client.sessionId);

            if (player) {
                const moveDistance = diceValue * 0.05; // Define how far to move
                player.position += moveDistance; // Update the position

                // Clamp the position between 0 and 1
                player.position = Math.max(0, Math.min(1, player.position));

                // Broadcast updated position
                this.broadcast("diceRolled", {
                    sessionId: client.sessionId,
                    diceValue: diceValue,
                    position: player.position
                });
            }
        });


    }

    // Called every time a client joins
    onJoin(client, options) {
        const player = new exports.Player();
        console.log(`Player ${client.sessionId} is attempting to join with initial position: ${player.position}`);


        // Add player to the state first  . nb should be CORRECT SYNTAX!!! This is closeus schema, not javascript obect!
        //this.state.players[client.sessionId] = player; //this works too

        this.state.players.set(client.sessionId, player);

        // Get the number of players after adding the new player
        const numberOfPlayers = Array.from(this.state.players.values()).length;

        // Assign a sprite type based on the current number of players
        player.spriteType = (numberOfPlayers % 2 === 0) ? 'sprite2' : 'sprite1';

        console.log(`Player ${client.sessionId} added to state with position: ${this.state.players[client.sessionId].position} new position: ${player.position}`);
    }

    onLeave(client, consented) {
        // Remove the player from the state when they leave
        delete this.state.players[client.sessionId];
        console.log(`Player ${client.sessionId} left.`);
    }

}
