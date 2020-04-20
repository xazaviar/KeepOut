const HashMap = require('hashmap');
const Player = require('./Player');
const Ball = require('./Ball');
const Util = require('./Util');
const passHash = require('password-hash');
const fs = require('fs');
var logger = require('winston');

function Game(DEV_MODE, log) {
    this.clients = new HashMap();
    this.players = new HashMap();
    this.ballCount = 0;
    this.BalltoPlayerRatio = 4;

    this.ballTransfer = false;

    this.changes = [];

    this.DEV_MODE = DEV_MODE;
    logger = log;

    this.emailList = [];
    var context = this;
    loadData(function(players){
        context.players = players;
        logger.info("Player data loaded");
    });
}

Game.create = function(DEV_MODE, logger) {
    
    return new Game(DEV_MODE, logger);
}

Game.prototype.addNewPlayer = function(socket, name, email, password) {
	logger.info("["+socket.id+"] "+name+" has joined the game.");
    this.clients.set(socket.id, socket);
    this.players.set(socket.id, Player.create("new", {  id: socket.id, 
                                                        auth: Util.generateToken(20), 
                                                        name: name, 
                                                        email: email, 
                                                        password: password,
                                                        DEV_MODE: this.DEV_MODE
                                                    }));

    this.emailList.push(email); //Should sort

    var players = [];
    var pList = this.getPlayers();
    for(var p in pList){
        if(pList[p].id != socket.id){
            players.push(pList[p].publicData());
        }
    }

    socket.emit('initial',{
        self: this.players.get(socket.id),
        players: players
    });

    this.changes.push({
        type:"newPlayer",
        player: this.players.get(socket.id).publicData()
    });
}

Game.prototype.reconnectPlayer = function(socket, email, password) {
    var players = this.getPlayers();
    var found = false;
    var oldID = null;
    for(var p in players){
        var creds = players[p].getLoginCreds();
    	if(email == creds[0] && passHash.verify(password, creds[1])){
			logger.info("["+socket.id+"] "+players[p].getName()+" has reconnected.");
            players[p].setActive(true);
            //Do not need to change ID (i believe)
    		oldID = players[p].getID();
    		players[p].setID(socket.id);
    		this.players.remove(oldID);
    		this.players.set(socket.id, players[p]);
    		found = true;
    		break;
    	}
    }

    if(found){
        this.clients.set(socket.id, socket);
        
        var players = [];
        var pList = this.getPlayers();
        for(var p in pList){
            if(pList[p].id != socket.id){
                players.push(pList[p].publicData());
            }
        }

        socket.emit('initial',{
            self: this.players.get(socket.id),
            players: players
        });

        this.changes.push({
            type:"playerReconnect",
            oldID: oldID,
            newID: socket.id
        });
    }else{
        socket.emit('failed-connect');
    }
}

Game.prototype.disconnectPlayer = function(id) {
    if(typeof this.players.get(id) !== "undefined"){
	    logger.info("["+id+"] "+this.players.get(id).getName()+" has disconnected.");
        this.players.get(id).setActive(false);

        this.changes.push({
            type:"playerDisconnect",
            id: id
        });
    }

    this.clients.remove(id);
}

Game.prototype.getPlayers = function() {
    return this.players.values();
}

Game.prototype.uniqueEmail = function(email){
    for(var e in this.emailList){
        if(this.emailList[e] == email) return false;
    }
    return true;
}

Game.prototype.update = function(){
	var players = this.getPlayers();

	//Check to see if players are getting rid of a ball
    for(var p in players){
    	if(players[p].removingBall()){
    		var rec = giveBall(players,players[p]);

            if(rec){
                this.changes.push({
                    type:"playerChange",
                    player: players[p].publicData()
                });
                this.changes.push({
                    type:"selfChange",
                    player: players[p]
                });
                for(var r in players){
                    if(players[r].id == rec){
                        this.changes.push({
                            type:"playerChange",
                            player: players[r].publicData()
                        });
                        this.changes.push({
                            type:"selfChange",
                            player: players[r]
                        });
                        break;
                    }
                }
            }     
    	}
        else if(players[p].hasChange()=="all"){
            this.changes.push({
                type:"playerChange",
                player: players[p].publicData()
            });
            this.changes.push({
                type:"selfChange",
                player: players[p]
            });
            players[p].gotChange();
        }
        else if(players[p].hasChange()=="self"){
            this.changes.push({
                type:"selfChange",
                player: players[p]
            });
            players[p].gotChange();
        }
    }

    //Check ball count
	var realCount = 0;
    for(var p in players){
    	realCount += players[p].getBallCount();
    }
    this.ballCount = realCount;



    //Check if new balls need to be added/removed
    if(parseInt(players.length/this.BalltoPlayerRatio)+1 > this.ballCount && players.length > 1){
    	//Add random
    	var target = parseInt(players.length/this.BalltoPlayerRatio)+1-this.ballCount;
    	logger.info("adding "+target+" balls [New Total: "+(this.ballCount+target)+"]");
    	for(var i = 0; i < target && players.length > 1; i++){
    		players = this.getPlayers();
            var r = parseInt(Math.random()*players.length);
    		players[r].newBall(Ball.create(Util.generateToken(10),{name:"~ROOT",id:"-1"},"NORMAL"));
            this.changes.push({
                type:"selfChange",
                player: players[r]
            });
            this.changes.push({
                type:"playerChange",
                player: players[r].publicData()
            });
    	}
    }

    //Since player count is not decreasing, this may no longer be needed
    // else if(parseInt(players.length/this.BalltoPlayerRatio)+1 < this.ballCount && players.length > 1){
    // 	//Remove random
    // 	var target = this.ballCount - parseInt(players.length/this.BalltoPlayerRatio)+1;
    // 	logger.info("removing "+target+" balls");
    // 	for(var i = 0; i < target && players.length > 1;i++){
    // 		players = this.getPlayers();

    // 		var r = parseInt(Math.random()*players.length);
    // 		if(typeof players[r] != "undefined" && players[r].getBallCount() > 0){
	   //  		players[r].removeBall();
	   //  	}
    // 	}
    // }
    // else if(players.length == 1 && this.ballCount > 0){
    // 	//Remove all
    // 	logger.info("removing all balls");
    // 	while(players[0].getBallCount() > 0){
	   //  	players[0].removeBall();
    // 	}
    // }
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
    if(this.changes != []){
        var ids = this.clients.keys();
        for (var i = 0; i < ids.length; i++) {
            var sendChanges = [];
            // logger.info(ids[i],"change length:",this.changes.length);
            for(var c in this.changes){
                if(this.changes[c].type=="selfChange" && this.changes[c].player.id == ids[i])
                    sendChanges.push(this.changes[c]);
                else if(this.changes[c].type=="playerChange" && this.changes[c].player.id != ids[i])
                    sendChanges.push(this.changes[c]);
                else if(this.changes[c].type!="selfChange" && this.changes[c].type!="playerChange")
                    sendChanges.push(this.changes[c]);
                
            }
            // logger.info(ids[i],"send length:",sendChanges.length);
            this.clients.get(ids[i]).emit('update', {
                updates: sendChanges
            });
        }

        this.changes = [];
    }
}

//Saving
Game.prototype.saveData = function(callback){
    if(this.players.values().length>0){
        fs.writeFile("./game data/player data/player_data.json", JSON.stringify(this.players.values()), function(err){
            if(err) logger.error(err);
            else{
                logger.info("Player data saved");
                if(callback) callback();
            } 
        });
    }
    else{
        logger.info("No player data to save");
        if(callback) callback();
    }
}

function loadData(callback){
    fs.readFile("./game data/player data/player_data.json", function(err, data){
        if(err){
            logger.error("FAILED TO LOAD DATA");
            logger.error(err);
            process.exit(1);
        } 
        else{
            var temp = JSON.parse(data);
            var players = new HashMap();

            for(var o in temp){
                players.set(temp[o].id, Player.create("restore",temp[o]));
            }
            callback(players);
        } 
    });
}

function giveBall(players, sender){
    var text = "give ball: "+sender.removingBall().type+" from->"+sender.name+" [TARGET: "+sender.removingBall().target+"]";
	logger.info(text);

	if(sender.removingBall().type == "RANDOM"){
        if(sender.removingBall().target!=null){
            for(var p in players){
                if(players[p].id == sender.removingBall().target){
                    players[p].newBall(sender.removeBall());
                    return players[p].id;
                }
            }
        }
        else{
            var count = 0, maxIter = 10;
            while(count < maxIter){
                var r = parseInt(Math.random()*players.length);
                if(players[r].id != sender.id){
                    players[r].newBall(sender.removeBall());
                    return players[r].id;
                }
                count++;
            }

            //Couldn't do it randomly
            if(count > maxIter-1)
                for(var p in players){
                    if(players[p].id != sender.id){
                        players[p].newBall(sender.removeBall());
                        return players[p].id;
                    }
                }
        }
	}
    else if(sender.removingBall().type == "TARGET"){
        for(var p in players){
            if(players[p].id == sender.removingBall().target){
                players[p].newBall(Ball.create(Util.generateToken(10),{name:sender.name,id:sender.id},"TARGET"));
                sender.sentTargetBall();
                return players[p].id;
            }
        }
    }

    return null;
}

module.exports = Game;