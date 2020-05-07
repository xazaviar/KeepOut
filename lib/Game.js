const HashMap = require('hashmap');
const Player = require('./Player');
const Ball = require('./Ball');
const Util = require('./Util');
const passHash = require('password-hash');
const fs = require('fs');
var logger = require('winston');


const saveFile = process.env.SAVE_FILE;
const BalltoPlayerRatio = parseFloat(process.env.BALL_TO_PLAYER_RATIO) || 1;
const AdditionalBalls = (parseInt(process.env.ADDITONAL_BALLS)==0?0:parseInt(process.env.ADDITONAL_BALLS) || 10);
const inactiveTime = (parseFloat(process.env.INACTIVE_TIME) || 48)*60*60*1000;
const GAME_RESET_TIME = (parseFloat(process.env.GAME_RESET_TIME) || 7*24)*60*60*1000; //7 days


function Game(id, log) {
    this.id = id;
    this.name = "";
    this.resetDate = 0;
    this.roundData = [];
    this.round = 1;


    this.clients = new HashMap();
    this.players = new HashMap();

    this.changes = [];

    this.DEV_MODE = process.env.ISPROD==false;
    logger = log;

    this.emailList = [];
    var context = this;

    loadGameData(id, function(data){
        context.name = data.name;
        context.resetDate = data.resetDate;
        context.roundData = data.roundData;
        context.round = data.round;

        logger.info(data.name+"'s game data loaded. This round ends on "+(new Date(data.resetDate).toLocaleString()));

        loadPlayerData(function(players, activeCount){
            context.players = players;
            logger.info("Player data loaded. Player Count: "+context.getPlayers().length+" | InGame: "+activeCount);
        });
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
        NEGATIVE_BOOST_SCALING_AMT: parseFloat(process.env.NEGATIVE_BOOST_SCALING_AMT) || 1,
        NEGATIVE_BOOST_SCALING_PER: parseFloat(process.env.NEGATIVE_BOOST_SCALING_PER) || 1000,
        MAX_TIME: parseInt(process.env.MAX_TIME) || 600,
        TARGET_BALL_COST:parseInt(process.env.TARGET_BALL_COST) || 100,
        GAME_SENDER: process.env.GAME_SENDER || "KEEPOUT"
    };
}

Game.create = function(id, logger) {
    
    return new Game(id, logger);
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
        if(pList[p].socket != socket.id && pList[p].isInGame()){
            players.push(pList[p].publicData());
        }
    }

    socket.emit('initial',{
        self: this.players.get(socket.id),
        players: players,
        rules: this.gameRules,
        gameInfo: {
            "id": this.id,
            "name": this.name,
            "resetDate": this.resetDate,
            "round": this.round,
            "roundData":this.roundData
        }
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
    var gameRejoin = false;
    for(var p in players){
        var creds = players[p].getLoginCreds();
    	if(email == creds[0] && passHash.verify(password, creds[1])){
			logger.info("["+socket.id+"] "+players[p].getName()+" has reconnected.");
            gameRejoin = !players[p].isInGame();
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
            if(pList[p].socket != socket.id && pList[p].isInGame()){
                players.push(pList[p].publicData());
            }
            else pid = pList[p].id;
        }

        socket.emit('initial',{
            self: this.players.get(socket.id),
            players: players,
            rules: this.gameRules,
            gameInfo: {
                "id": this.id,
                "name": this.name,
                "resetDate": this.resetDate,
                "round": this.round,
                "roundData":this.roundData
            }
        });


        if(gameRejoin)
            this.changes.push({
                type:"newPlayer",
                player: this.players.get(socket.id).publicData()
            });
        else
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
    var inGameCount = 0;

	//Check to see if players are getting rid of a ball
    for(var p in players){
        var removingPlayer = players[p].isInGame();

        //Check if the player is still in the game
        if(players[p].isInGame())
            players[p].verifyInGame(inactiveTime);

        if(removingPlayer && !players[p].isInGame()){
            logger.info("["+players[p].socket+"] "+players[p].name+" has left the game.");
            this.changes.push({
                type:"playerRemoved",
                id: players[p].id
            });
        }
        if(players[p].isInGame()) inGameCount++

    	if(players[p].removingBall() && players[p].isInGame()){
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
        if(players[p].inGame)
    	   realCount += players[p].getBallCount();
    }


    //Check if new balls need to be added/removed
    var normalBallCount = parseInt(inGameCount/BalltoPlayerRatio)+AdditionalBalls;
    if(normalBallCount > realCount && inGameCount > 1){
    	//Add random
    	var target = normalBallCount-realCount;
    	logger.info("adding "+target+" balls [New Total: "+(realCount+target)+"]");
    	for(var i = 0; i < target && inGameCount > 1; i++){
    		players = this.getPlayers();
            var r = parseInt(Math.random()*players.length);
            if(players[r].isInGame()){
                players[r].newBall(Ball.create(Util.generateToken(10),{name:process.env.GAME_SENDER,id:"-1"},"NORMAL"));
                this.changes.push({
                    type:"selfChange",
                    player: players[r]
                });
                this.changes.push({
                    type:"playerChange",
                    player: players[r].publicData()
                });
            }
            else i--; //potential for infinite looping, should do queuing system
    	}
    }else if(normalBallCount < realCount || (inGameCount <= 1 && realCount > 0)){
        var removed = 0;
        for(var p in players){
            if(players[p].isInGame() && players[p].getBallCount()>0){
                players[p].removeNormalBall();
                removed++;

                if(normalBallCount >= realCount-removed) break;
            }
        }
        logger.info("removing "+removed+" balls [New Total: "+(realCount-removed)+"]");
    }
}

Game.prototype.constUpdate = function() {
	//This does scoring and only scoring
	var players = this.getPlayers();
    if(players.length > 1)
        for(var p in players){
        	if(players[p].isInGame())
        		players[p].update();
        }

    //Check for game reset
    if(Date.now() >= this.resetDate) this.gameReset();
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

//Game Reset and scoring
Game.prototype.gameReset = function(){
    logger.info("--------------------------------------------");
    logger.info(this.name+"'s round has come to an end.");
    var players = this.players.values();

    //Rank all players
    players.sort(function(a,b){
        if(!a.inGame && !b.inGame) return 0
        if(!a.inGame) return 1;
        if(!b.inGame) return -1;

        if(a.score>b.score) return -1;
        if(a.score<b.score) return 1;
        return 0
    });

    //count in game
    var inGameCount = 0;
    for(var p in players) inGameCount += players[p].inGame;

    var ranking = [];
    var prevScore = -10000000000, rank = 0, skip = 1;
    logger.info("LEADERBOARD:");
    for(var p in players){
        if(!players[p].inGame){ //should be sorted so all players not in game are a the bottom of list.
            players[p].resetRound(null);
            // break;
        } 
        else{
            if(players[p].score != prevScore){
            rank+=skip;
            skip = 1;
            }else skip++;
            prevScore = players[p].score;
            var rankInfo = {
                "rank": (players[p].inGame?rank:null),
                "id": players[p].id,
                "name": players[p].name,
                "score": players[p].score
            };
            ranking.push(rankInfo);
            logger.info(rank+": "+players[p].name+" | "+players[p].score);


            //Give rewards based on rank
            if(rank < 11){
                //Ranked prize
                players[p].experience   += (11-rank)*(11-rank)*100+1000;
                players[p].targetBalls  += Math.ceil(inGameCount/rank)+Math.ceil(inGameCount/3);
                players[p].money        += (Math.ceil(inGameCount/rank)+(11-rank)*(11-rank))*25+500;
                players[p].moneyTotal   += (Math.ceil(inGameCount/rank)+(11-rank)*(11-rank))*25+500;
            }
            else{
                //Participation prize
                players[p].targetBalls  += Math.min(Math.ceil(inGameCount/5),50);
                players[p].money        += Math.min(Math.ceil(inGameCount/6),30)*25;
                players[p].moneyTotal   += Math.min(Math.ceil(inGameCount/6),30)*25;
            }


            //Reset scores and setup for the next game
            players[p].resetRound(rankInfo);
            this.changes.push({
                type:"playerChange",
                player: players[p].publicData()
            });
            this.changes.push({
                type:"selfChange",
                player: players[p]
            });
        }
    }
    //Add new round data
    this.roundData.push({
        "round": this.round,
        "start": this.resetDate,
        "end": Date.now(), 
        "rankings": ranking
    });

    //Set next round
    this.round++;
    this.resetDate = new Date(Date.now() + GAME_RESET_TIME).getTime();
    this.changes.push({
        type:"gameChange",
        gameInfo: {
            "id": this.id,
            "name": this.name,
            "resetDate": this.resetDate,
            "round": this.round,
            "roundData":this.roundData
        }
    });


    this.saveGameData();

    logger.info(this.name+"'s next round end on "+(new Date(this.resetDate).toLocaleString()));
    logger.info("--------------------------------------------");
}



//Saving
Game.prototype.savePlayerData = function(callback, gameClose){
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

function loadPlayerData(callback){
    fs.readFile(saveFile, function(err, data){
        if(err){
            logger.error("FAILED TO LOAD PLAYER DATA");
            logger.error(err);
            process.exit(1);
        } 
        else{
            var temp = JSON.parse(data);
            var players = new HashMap();
            var activeCount = 0;

            for(var o in temp){
                players.set(temp[o].socket, Player.create("restore",temp[o]));
                if(players.get(temp[o].socket).isInGame()) activeCount++;
            }
            callback(players, activeCount);
        } 
    });
}

Game.prototype.saveGameData = function(callback, gameClose){
    var data = {
        "id": this.id,
        "name": this.name,
        "ballToPlayerRatio": BalltoPlayerRatio,
        "resetDate": this.resetDate,
        "players": [],
        "round": this.round,
        "roundData":this.roundData
    };
    var context = this;
    fs.writeFile("./game_data/games/"+this.id+".json", JSON.stringify(data, null, 4), function(err){
        if(err) logger.error(err);
        else{
            logger.info(context.name+"'s game data saved");
            if(callback) callback();
        } 
    });
}

function loadGameData(id, callback){
    fs.readFile("./game_data/games/"+id+".json", function(err, data){
        if(err){
            logger.error("FAILED TO LOAD GAME DATA");
            logger.error(err);
            process.exit(1);
        } 
        else{
            callback(JSON.parse(data));
        } 
    });
}

function giveBall(players, sender){
    var text = "give ball: "+sender.removingBall().type+" from->"+sender.name+" [TARGET: "+sender.removingBall().target+"]";
	logger.info(text);

	if(sender.removingBall().type == "RANDOM"){
        var sentBall = false;
        //Random ball has a target
        if(sender.removingBall().target!=null){
            for(var p in players){
                if(players[p].id == sender.removingBall().target){
                    if(!players[p].isInGame()){
                        sender.permTarget == null;
                        break;
                    }
                    players[p].newBall(sender.removeBall());
                    sentBall = true;
                    return players[p].id;
                }
            }
        }

        //Random ball does not have a target
        if(!sentBall){
            var count = 0, maxIter = 10;
            while(count < maxIter){
                var r = parseInt(Math.random()*players.length);
                if(players[r].id != sender.id && players[r].isInGame()){
                    players[r].newBall(sender.removeBall());
                    return players[r].id;
                }
                count++;
            }

            //Couldn't do it randomly
            if(count > maxIter-1)
                for(var p in players){
                    if(players[p].id != sender.id && players[r].isInGame()){
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