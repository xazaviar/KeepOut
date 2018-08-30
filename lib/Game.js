const HashMap = require('hashmap');
const Player = require('./Player');
const Ball = require('./Ball');

function Game() {
    this.clients = new HashMap();
    this.players = new HashMap();
    this.ballCount = 0;
    this.BalltoPlayerRatio = 5;

    this.ballTransfer = false;
}

Game.create = function() {
    
    return new Game();
}

Game.prototype.addNewPlayer = function(socket, name) {
	console.log("["+socket.id+"] "+name+" has connected.");
    this.clients.set(socket.id, socket);
    this.players.set(socket.id, Player.create(socket.id, generateToken(20), name));
}

Game.prototype.reconnectPlayer = function(socket, name, auth) {
    this.clients.set(socket.id, socket);

    var players = this.getPlayers();
    var found = false;
    for(var p in players){
    	if(players[p].getAuth() == auth){
			console.log("["+socket.id+"] "+players[p].getName()+" has reconnected.");
    		var oldID = players[p].getID();
    		players[p].setID(socket.id);
            players[p].setActive(true);
    		this.players.remove(oldID);
    		this.players.set(socket.id, players[p]);
    		found = true;
    		break;
    	}
    }

    if(!found) this.addNewPlayer(socket, name);
}

Game.prototype.disconnectPlayer = function(id) {
    if(typeof this.players.get(id) !== "undefined"){
	    console.log("["+id+"] "+this.players.get(id).getName()+" has disconnected.");
        this.players.get(id).setActive(false);
    }

    this.clients.remove(id);
}

Game.prototype.getPlayers = function() {
    return this.players.values();
}

Game.prototype.update = function(){
	var players = this.getPlayers();

	//Check to see if players are getting rid of a ball
    for(var p in players){
    	if(players[p].removingBall()){
    		giveBall(players,players[p]);
    	}
    }

    //Check ball count
	var realCount = 0;
    for(var p in players){
    	realCount += players[p].getBalls().length;
    }
    this.ballCount = realCount;



    //Check if new balls need to be added/removed
    if(parseInt(players.length/this.BalltoPlayerRatio)+1 > this.ballCount && players.length > 1){
    	//Add random
    	var target = parseInt(players.length/this.BalltoPlayerRatio)+1-this.ballCount;
    	console.log("adding "+target+" balls");
    	for(var i = 0; i < target && players.length > 1; i++){
    		players = this.getPlayers();
    		players[parseInt(Math.random()*players.length)].newBall(Ball.create(generateToken(10),{name:"~ROOT",id:"-1"}));
    	}
    }
    else if(parseInt(players.length/this.BalltoPlayerRatio)+1 < this.ballCount && players.length > 1){
    	//Remove random
    	var target = this.ballCount - parseInt(players.length/this.BalltoPlayerRatio)+1;
    	console.log("removing "+target+" balls");
    	for(var i = 0; i < target && players.length > 1;i++){
    		players = this.getPlayers();

    		var r = parseInt(Math.random()*players.length);
    		if(typeof players[r] != "undefined" && players[r].getBalls() > 0){
	    		players[r].removeBall();
	    	}
    	}
    }
    else if(players.length == 1 && this.ballCount > 0){
    	//Remove all
    	console.log("removing all balls");
    	while(players[0].getBalls() > 0){
	    	players[0].removeBall();
    	}
    }
}

Game.prototype.constUpdate = function() {
	//This does scoring and only scoring
	var players = this.getPlayers();
    for(var p in players){
    	if(players.length > 1)
    		players[p].update();
    }
}

Game.prototype.updatePlayerOnInput = function(id, data) {
	var player = this.players.get(id);
    if (player) player.updateOnInput(data.keyboardState, data.mouseState, data.gameState);   
}

Game.prototype.sendState = function() {
    var ids = this.clients.keys();
    for (var i = 0; i < ids.length; i++) {
        this.clients.get(ids[i]).emit('update', {
            self: this.players.get(ids[i]),
            players: this.players.values().filter((player) => player.id != ids[i])
        });
    }
}

function generateToken(n){
	const chars = ['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z',
				   'A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z',
				   '0','1','2','3','4','5','6','7','8','9']
	var token = '';
	for(var i = 0; i < n; i++){
		token += chars[parseInt(Math.random()*chars.length)];
	}
	return token;
}

function giveBall(players, sender){
	console.log("give ball:", sender.removingBall().type);
	if(sender.removingBall().type == "random"){
		var count = 0, maxIt = 10;
		while(count < maxIt){
    		var r = parseInt(Math.random()*players.length);
    		if(players[r].id != sender.id){
    			players[r].newBall(sender.removeBall());
    			break;
    		}
    		count++;
		}
		if(count > maxIt-1)
			for(var p in players){
				if(players[p].id != sender.id){
	    			players[r].newBall(sender.removeBall());
	    			break;
	    		}
			}
	}
}

module.exports = Game;