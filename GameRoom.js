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
        //this.currentTurn = null;
    }
}

// STATE SCHEMA
// To tell Colyseus how to synchronize the state of individual players across clients
schema.defineTypes(exports.State, {
    players: { map: exports.Player },
    //currentTurn: "string"
});

exports.GameRoom = class GameRoom extends colyseus.Room {
    // Colyseus will invoke when creating the room instance
    onCreate(options) {
        // initialize empty room state
        //this.maxClients = 2;
        this.setState(new exports.State()); // Reference the State class correctly



        // Called every time this room receives a "rollDice" message
        this.onMessage("rollDice", (client) => {
            /*
            if (this.state.currentTurn !== client.sessionId) {
                console.log(`Player ${client.sessionId} attempted to roll the dice out of turn.`);
                return; // Ignore dice roll if it's not this player's turn
            } */
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

                // After the move, pass the turn to the next player
                //this.passTurnToNextPlayer();
            }
        });


    }
    /*
        passTurnToNextPlayer() {
            const players = Array.from(this.state.players.keys());
            const currentTurnIndex = players.indexOf(this.state.currentTurn);
    
            // Move to the next player in the list
            const nextTurnIndex = (currentTurnIndex + 1) % players.length;
            this.state.currentTurn = players[nextTurnIndex];
    
            // Notify all clients about the turn change
            this.broadcast("newTurn", { sessionId: this.state.currentTurn });
        } */


    // Called every time a client joins
    onJoin(client, options) {
        const player = new exports.Player();
        console.log(`Player ${client.sessionId} is attempting to join with initial position: ${player.position}`);

        /*
        // If this is the first player, assign the turn 
        if (this.state.currentTurn === null) {
            this.state.currentTurn = client.sessionId;
        }

        console.log(`Player ${client.sessionId} joined. Current turn: ${this.state.currentTurn}`); */

        // Add player to the state first  . nb should be CORRECT SYNTAX!!! This is closeus schema, not javascript obect!
        // this.state.players[client.sessionId] = player; //this works too

        this.state.players.set(client.sessionId, player);

        // Get the number of players after adding the new player
        const numberOfPlayers = Array.from(this.state.players.values()).length;

        // Assign a sprite type based on the current number of players
        if (numberOfPlayers === 1) {
            player.spriteType = 'sprite1'; // First player
        } else if (numberOfPlayers === 2) {
            player.spriteType = 'sprite2'; // Second player
        } else if (numberOfPlayers === 3) {
            player.spriteType = 'sprite3'; // Third player (booImage)
        } else if (numberOfPlayers === 4) {
            player.spriteType = 'sprite4'; //carrot
        } else {
            // If more than 3 players, you could alternate or loop between sprites
            const spriteTypes = ['sprite1', 'sprite2', 'sprite3', 'sprite4'];
            player.spriteType = spriteTypes[(numberOfPlayers - 1) % 4]; // Cycle between sprite1, sprite2, and sprite3
        }

        console.log(`Player ${client.sessionId} added to state with sprite: ${player.spriteType}`);
    }

    onLeave(client, consented) {
        // Remove the player from the state when they leave
        delete this.state.players[client.sessionId];
        console.log(`Player ${client.sessionId} left.`);
    }

}
