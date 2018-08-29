const HashMap = require('hashmap');
const Player = require('./Player');

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
    this.clients.set(socket.id, socket);
    this.players.set(socket.id, Player.create(socket.id, generateToken(20), name));
}

Game.prototype.removePlayer = function(id) {
    this.clients.remove(id);
    this.players.remove(id);
}

Game.prototype.getPlayers = function() {
    return this.players.values();
}

Game.prototype.update = function(){
	var players = this.getPlayers();

	//Check to see if players are getting rid of a ball
    for(var p in players){
    	if(players[p].returningBall()){
    		giveBall(players,players[p],players[p].returningBall());
    	}
    }

    //Check ball count
	var realCount = 0;
    for(var p in players){
    	realCount += players[p].getBalls();
    }
    this.ballCount = realCount;



    //Check if new balls need to be added/removed
    if(parseInt(players.length/this.BalltoPlayerRatio)+1 > this.ballCount && players.length > 1){
    	//Add random
    	var target = parseInt(players.length/this.BalltoPlayerRatio)+1-this.ballCount;
    	console.log("adding "+target+" balls");
    	for(var i = 0; i < target && players.length > 1;i++){
    		players = this.getPlayers();
    		players[parseInt(Math.random()*players.length)].newBall();
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

function giveBall(players, sender, type){
	console.log("give ball:", type);
	if(type == "random"){
		var count = 0;
		while(count < 10){
    		var r = parseInt(Math.random()*players.length);
    		if(players[r].id != sender.id){
    			players[r].newBall();
    			sender.removeBall();
    			break;
    		}
    		count++;
		}
		if(count > 9)
			for(var p in players){
				if(players[p].id != sender.id){
	    			players[r].newBall();
	    			sender.removeBall();
	    			break;
	    		}
			}
	}
}

module.exports = Game;