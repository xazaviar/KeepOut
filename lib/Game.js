const HashMap = require('hashmap');
const Player = require('./Player');
const Ball = require('./Ball');
const Util = require('./Util');
const passHash = require('password-hash');
const fs = require('fs');
var logger = require('winston');
const saveFile = "./game_data/player_data/player_data.json";

function Game(DEV_MODE, log) {
    this.clients = new HashMap();
    this.players = new HashMap();
    this.BalltoPlayerRatio = 4;

    this.ballTransfer = false;

    this.changes = [];

    this.DEV_MODE = DEV_MODE;
    logger = log;

    this.emailList = [];
    var context = this;
    loadData(function(players){
        context.players = players;
        logger.info("Player data loaded. Player Count: "+context.getPlayers().length);
    });


    //Define Game rules base on environment variables
    this.gameRules = {
        FPS: parseInt(process.env.FPS) || 20,
        BASE_POINT_GAIN: parseInt(process.env.BASE_POINT_GAIN) || 1,
        NO_BALL_EXP: parseInt(process.env.NO_BALL_EXP) || 1,
        BALL_SWAT_EXP: parseInt(process.env.BALL_SWAT_EXP) || 50,
        MONEY_GAIN_CHECK: parseInt(process.env.MONEY_GAIN_CHECK) || 2,
        MONEY_GAIN_AMOUNT: parseInt(process.env.MONEY_GAIN_AMOUNT) || 1,
        AUTO_SWAT_PUNISHMENT: parseInt(process.env.AUTO_SWAT_PUNISHMENT) || 100,
        BALL_POINT_COST: parseFloat(process.env.BALL_POINT_COST) || -.5,
        MAX_TIME: parseInt(process.env.MAX_TIME) || 600,
        TARGET_BALL_COST:parseInt(process.env.TARGET_BALL_COST) || 100
    };
}

Game.create = function(DEV_MODE, logger) {
    
    return new Game(DEV_MODE, logger);
}

Game.prototype.addNewPlayer = function(socket, name, email, password) {
	logger.info("["+socket.id+"] "+name+" has joined the game.");
    this.clients.set(socket.id, socket);
    this.players.set(socket.id, Player.create("new", {  socket: socket.id, 
                                                        id: Util.generateToken(20), 
                                                        name: name, 
                                                        email: email, 
                                                        password: password,
                                                        DEV_MODE: this.DEV_MODE
                                                    }));

    this.emailList.push(email); //Should sort

    var players = [];
    var pList = this.getPlayers();
    for(var p in pList){
        if(pList[p].socket != socket.id){
            players.push(pList[p].publicData());
        }
    }

    socket.emit('initial',{
        self: this.players.get(socket.id),
        players: players,
        rules: this.gameRules
    });

    this.changes.push({
        type:"newPlayer",
        player: this.players.get(socket.id).publicData()
    });
}

Game.prototype.reconnectPlayer = function(socket, email, password) {
    var players = this.getPlayers();
    var found = false;
    var oldSocket = null;
    for(var p in players){
        var creds = players[p].getLoginCreds();
    	if(email == creds[0] && passHash.verify(password, creds[1])){
			logger.info("["+socket.id+"] "+players[p].getName()+" has reconnected.");
            players[p].setActive(true);
            //Do not need to change socket.id (i believe)
    		oldSocket = players[p].getSocket();
    		players[p].setSocket(socket.id);
            this.players.delete(oldSocket);
    		this.players.set(socket.id, players[p]);
    		found = true;
    		break;
    	}
    }

    if(found){
        this.clients.set(socket.id, socket);
        
        var players = [];
        var pList = this.getPlayers();
        var pid = -1;
        for(var p in pList){
            if(pList[p].socket != socket.id){
                players.push(pList[p].publicData());
            }
            else pid = pList[p].id;
        }

        socket.emit('initial',{
            self: this.players.get(socket.id),
            players: players,
            rules: this.gameRules
        });

        this.changes.push({
            type:"playerReconnect",
            id: pid
        });
    }else{
        socket.emit('failed-connect');
    }
}

Game.prototype.disconnectPlayer = function(socket) {
    if(typeof this.players.get(socket) !== "undefined"){
	    logger.info("["+socket+"] "+this.players.get(socket).getName()+" has disconnected.");
        this.players.get(socket).setActive(false);

        this.changes.push({
            type:"playerDisconnect",
            id: this.players.get(socket).id
        });
    }

    this.clients.delete(socket);
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



    //Check if new balls need to be added/removed
    if(parseInt(players.length/this.BalltoPlayerRatio)+1 > realCount && players.length > 1){
    	//Add random
    	var target = parseInt(players.length/this.BalltoPlayerRatio)+1-realCount;
    	logger.info("adding "+target+" balls [New Total: "+(realCount+target)+"]");
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
            for(var c in this.changes){
                if(this.changes[c].type=="selfChange" && this.changes[c].player.socket == ids[i])
                    sendChanges.push(this.changes[c]);
                else if(this.changes[c].type=="playerChange" && this.changes[c].player.socket != ids[i])
                    sendChanges.push(this.changes[c]);
                else if(this.changes[c].type!="selfChange" && this.changes[c].type!="playerChange")
                    sendChanges.push(this.changes[c]);
            }
            this.clients.get(ids[i]).emit('update', {
                updates: sendChanges
            });
        }

        this.changes = [];
    }
}

//Saving
Game.prototype.saveData = function(callback, gameClose){
    if(this.players.values().length>0){
        if(gameClose){
            var players = this.getPlayers();
            for(var p in players){
                players[p].cleanHistory();
            }
        }

        fs.writeFile(saveFile, JSON.stringify(this.players.values()), function(err){
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
    fs.readFile(saveFile, function(err, data){
        if(err){
            logger.error("FAILED TO LOAD DATA");
            logger.error(err);
            process.exit(1);
        } 
        else{
            var temp = JSON.parse(data);
            var players = new HashMap();

            for(var o in temp){
                players.set(temp[o].socket, Player.create("restore",temp[o]));
            }
            callback(players);
        } 
    });
}

function giveBall(players, sender){
    var text = "give ball: "+sender.removingBall().type+" from->"+sender.name+" [TARGET: "+sender.removingBall().target+"]";
	logger.info(text);

	if(sender.removingBall().type == "RANDOM"){
        //Random ball has a target
        if(sender.removingBall().target!=null){
            for(var p in players){
                if(players[p].id == sender.removingBall().target){
                    players[p].newBall(sender.removeBall());
                    return players[p].id;
                }
            }
        }

        //Random ball does not have a target
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