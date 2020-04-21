const Ball = require('./Ball');

//Experience
const NO_BALL_EXP = parseInt(process.env.NO_BALL_EXP) || 1;
const BALL_SWAT_EXP = parseInt(process.env.BALL_SWAT_EXP) || 50;

//Money
const MONEY_GAIN_CHECK = parseInt(process.env.MONEY_GAIN_CHECK) || 20;
const MONEY_GAIN_AMOUNT = parseInt(process.env.MONEY_GAIN_AMOUNT) || 1;

//Money ball
const MONEY_BALL_BASE_CHANCE = parseFloat(process.env.MONEY_BALL_BASE_CHANCE) || .05;
const MONEY_BALL_INCREASE_PER_CHECK = parseFloat(process.env.MONEY_BALL_INCREASE_PER_CHECK) || .005;
const MONEY_BALL_CHECK = parseInt(process.env.MONEY_BALL_CHECK) || 60;
const MONEY_BALL_MONEY_MAX = parseInt(process.env.MONEY_BALL_MONEY_MAX) || 50; //per minute left on ball

//Auto Swat
const AUTO_SWAT_PUNISHMENT = parseInt(process.env.AUTO_SWAT_PUNISHMENT) || 100;

function Player(type, opts){
	if(type=="new"){
		this.socket		= opts.socket
		this.id 		= opts.id;
		this.name 		= opts.name;
		this.email		= opts.email;
		this.password	= opts.password;

		//Stats
		this.level		= 0;
		this.experience = 0;
		this.expPrev	= 0;
		this.nextLevel	= 220;
		this.lifetime 	= 0; //Total time spent
		this.activetime = 0; //Total time spent online
		this.score		= 0; //Time without ball or lifetime - balltimeS
		this.highScore	= 0; //Highest score
		this.lowScore	= 0; //lowest score
		this.balltime	= 0; //Time spent with balls
		this.balltimeS	= 0; //Time spent with balls (stacked with multiple balls)
		this.balls		= [];//Ball list 
		this.ballCount  = 0; //Total ball count
		this.moneyBallCount  = 0; //Total money ball count
		this.targetBallCount = 0; //Total target balls
		this.targetBallsSent = 0; //Total number of target balls sent
		this.swatCount  = 0; //Total number of balls swatted away
		this.backColor	= "#000";
		this.money		= 0;
		this.moneyTotal = this.money;
		this.ballHistory = [];

		this.moneyBallChance = .25; //Chance of getting the moneyball
		this.hasMoneyBall = false;

		//Store Items
		this.activeBoost = {amt:1,dur:-1};
		this.shield = null; //Type, dur/hits
		this.targetBalls = 0;


		//Flags
		this.permTarget = null;
		this.change = false;
		this.curTargetBalls = 0;
		this.showLvlUp  = false;
		// this.newItemsInStore = 0;
		this.ballReturn = null;
		this.isActive	= true;
		this.autoSwat	= false;
		this.menu		= [true,true,false,false,false,false]; 	//stats, leaderboard, quickStats, target, history, settings

		this.prevLeft = false;

		if(opts.DEV_MODE){
			this.level = 0;
			this.targetBalls = 3;
			this.money = 10000000;
			this.moneyTotal = this.money;
			this.unlockAll();
		}
	}else if(type=="restore"){
		this.socket		= opts.socket
		this.id 		= opts.id;
		this.name 		= opts.name;
		this.email		= opts.email;
		this.password	= opts.password;

		//Stats
		this.level		= opts.level;
		this.experience = opts.experience;
		this.expPrev	= opts.expPrev;
		this.nextLevel	= opts.nextLevel;
		this.lifetime 	= opts.lifetime; 
		this.activetime = opts.activetime; 
		this.score		= opts.score; 
		this.highScore	= opts.highScore; 
		this.lowScore	= opts.lowScore; 
		this.balltime	= opts.balltime; 
		this.balltimeS	= opts.balltimeS; 
		this.balls		= []; 
		this.ballCount  = opts.ballCount; 
		this.moneyBallCount  = opts.moneyBallCount; 
		this.targetBallCount = opts.targetBallCount; 
		this.targetBallsSent = opts.targetBallsSent; 
		this.swatCount  = opts.swatCount; 
		this.backColor	= opts.backColor;
		this.money		= opts.money;
		this.moneyTotal = opts.moneyTotal;
		this.ballHistory = opts.ballHistory;

		this.moneyBallChance = opts.moneyBallChance; 
		this.hasMoneyBall = false;

		//Store Items
		this.activeBoost = opts.activeBoost;
		this.shield = opts.shield; 
		this.targetBalls = opts.targetBalls;


		//Flags
		this.permTarget = opts.permTarget;
		this.change = opts.change;
		this.curTargetBalls = 0;
		this.showLvlUp  = opts.showLvlUp;
		this.ballReturn = opts.ballReturn;
		this.isActive	= false;
		this.autoSwat	= opts.autoSwat;
		this.menu		= opts.menu; 	

		this.prevLeft = opts.prevLeft;
	}
}

Player.create = function(type, opts) {
  	
  	return new Player(type, opts);
}

Player.prototype.unlockAll = function(){
	for(var m in this.menu)
		this.menu[m] = true;
	// this.menu[2] = false; //quickStats
}

Player.prototype.updateOnInput = function(keyboardState, mouseState, gameState){
	//Swat a ball
	if(gameState.auth != null && this.balls.length > 0 && this.ballReturn == null){
		for(var b in this.balls){
			if(this.balls[b].auth == gameState.auth){
				if(this.balls[b].type != "NORMAL")
					this.removeTempBall(b);
				else
					this.ballReturn = {
						type: "RANDOM",
						target: this.permTarget,
						ball: this.balls[b]
					};
				break;
			}
		}
	}

	//Send a ball to target
	if(this.targetBalls > 0 && gameState.sendBall != null){
		this.ballReturn = {
			type: "TARGET",
			target: gameState.sendBall
		};
	}
	else if(this.targetBalls == 0 && this.money >= parseInt(process.env.TARGET_BALL_COST) && gameState.sendBall != null){
		this.money -= parseInt(process.env.TARGET_BALL_COST);
		this.change = "self";
		this.targetBalls++;
		this.ballReturn = {
			type: "TARGET",
			target: gameState.sendBall
		};
	}

	this.prevLeft = mouseState.left;
	this.backColor = gameState.backColor;
	this.permTarget = gameState.permTarget;
}

Player.prototype.update = function(){
	//Check items
	if(this.activeBoost.dur > 0) this.activeBoost.dur--;
	else this.activeBoost = {amt:1,dur:-1};

	if(this.shield!=null)
		if(this.shield.type == "time" && this.shield.dur > 0) this.shield.dur--;
		else if(this.shield.type == "time") this.shield = null
		else if(this.shield.type == "hits" && this.shield.hits <= 0) this.shield = null;

	//Update balls and check shields
	for(var b in this.balls){
		this.balls[b].update();
		if(this.balls[b].doAutoSwat()){
			this.autoSwat = true;

			if(this.balls[b].type != "NORMAL")
				this.removeTempBall(b);
			else
				this.ballReturn = {
					type: "RANDOM",
					ball: this.balls[b]
				};
		}
		else if(this.shield != null && (this.shield.type=="time" || (this.shield.type=="hits" && this.shield.hits > 0))){
			if(this.balls[b].type != "NORMAL")
				this.removeTempBall(b);
			else if(this.ballReturn == null)
				this.ballReturn = {
					type: "RANDOM",
					ball: this.balls[b]
				};

			if(this.shield.type=="hits") this.shield.hits--;
		}
	}
	
	var activeShield = (this.shield != null && (this.shield.type=="time" || (this.shield.type=="hits" && this.shield.hits > 0)))

	//Update Counters
	this.lifetime++;
	if(!activeShield) this.balltimeS += this.balls.length-this.hasMoneyBall;
	if(!activeShield && this.balls.length-this.hasMoneyBall > 0) this.balltime++;
	if(activeShield) this.score += this.activeBoost.amt; //Lifetime - ballcount
	else this.score += this.activeBoost.amt - (this.balls.length-this.hasMoneyBall); //Lifetime - ballcount

	//Score records
	if(this.score > this.highScore) this.highScore = 0+this.score;
	if(this.score < this.lowScore) this.lowScore = 0+this.score;

	if(this.isActive) this.activetime++;

	//Check for moneyball
	if(this.lifetime%MONEY_BALL_CHECK==0 && !this.hasMoneyBall){
		var r = Math.random();
		if(r <= this.moneyBallChance){
			this.moneyBallChance = MONEY_BALL_BASE_CHANCE;
			this.hasMoneyBall = true;
			this.moneyBallCount++;
			this.newBall(Ball.create("MONEY-MONEY-MONEY",{name:"~ROOT",id:"-1"},"MONEY"));
			this.change = "self";
		}
		else this.moneyBallChance += MONEY_BALL_INCREASE_PER_CHECK;
	}

	//Check for money
	if(this.lifetime%MONEY_GAIN_CHECK==0){
		this.money+=MONEY_GAIN_AMOUNT;
		this.moneyTotal+=MONEY_GAIN_AMOUNT;
		this.change = "self";
	} 

	//Check leveling
	if(this.balls.length-this.hasMoneyBall == 0) this.experience+=NO_BALL_EXP;
	if(this.experience >= this.nextLevel) this.levelUp();
}

Player.prototype.levelUp = function(){
	const expNeed = [0,220,550,1100,6600,13200,26400,52800,105600,211200,422400];

	this.level++;
	this.change = "self";
	if(this.level+1 < expNeed.length){
		this.expPrev = expNeed[this.level];
		this.nextLevel = expNeed[this.level+1];
	} 
	else {
		this.expPrev = expNeed[expNeed.length-1]*(this.level-9);
		this.nextLevel = expNeed[expNeed.length-1]*(this.level-8);
	}
	this.showLvlUp = true;

	//Give Rewards
	this.money += this.level * this.level * 10;
	this.moneyTotal += this.level * this.level * 10;

	if(this.level == 1){//Give quickStats
		this.menu[2] = true; 
	} 
	if(this.level == 2){//Give store and targetting
		this.menu[3] = true;
		this.menu[4] = true;
		// this.store[0].available = true;
		// this.newItemsInStore = 1;
		this.money += 200;
		this.moneyTotal += 200;
	}  
	if(this.level == 3){//Give Shields
		// this.store[1].available = true;
		// this.store[2].available = true;
		// this.newItemsInStore = 2;
		this.money += 400;
		this.moneyTotal += 400;
	}    
	if(this.level == 5){//Give Boosts
		// this.store[3].available = true;
		// this.store[4].available = true;
		// this.store[5].available = true;
		// this.newItemsInStore = 3;
		this.money += 1000;
		this.moneyTotal += 1000;
	}   
	if(this.level == 6){//Give Settings
		this.menu[5] = true;
	}
}

Player.prototype.removingBall = function(){
	return this.ballReturn;
}

Player.prototype.newBall = function(ball){
	this.balls.push(ball);
	this.ballCount++;
	this.ballHistory.push({
		id: this.ballCount,
		auth: ball.auth,
		type: ball.type,
		sender: ball.sender,
		received: Date.now(),
		removed: null,
		autoSwat: false
	});
	if(ball.type == "TARGET"){
		this.curTargetBalls++;
		this.targetBallCount++;
	}
}

Player.prototype.removeTempBall = function(b){
	if(this.balls[b].type == "MONEY"){
		if(this.balls[b].curTime>0 && this.shield==null){
			this.money += (parseInt(this.balls[b].curTime/60)+1) * MONEY_BALL_MONEY_MAX;
			this.moneyTotal += (parseInt(this.balls[b].curTime/60)+1) * MONEY_BALL_MONEY_MAX;
		}
		this.hasMoneyBall = false;
		this.change = "self";
	}else if(this.autoSwat){
		this.balltimeS += AUTO_SWAT_PUNISHMENT;
		this.score -= AUTO_SWAT_PUNISHMENT;
	} 

	if(this.balls[b].type == "TARGET"){
		this.change = "all";
		this.curTargetBalls--;
	} 

	if(!this.autoSwat && this.shield==null){
		this.swatCount++;
		this.experience += BALL_SWAT_EXP;
	}


	//Update History
	for(var h = this.ballHistory.length-1; h > -1; h--){
		if(this.balls[b].auth == this.ballHistory[h].auth){
			this.ballHistory[h].removed = Date.now();
			this.ballHistory[h].autoSwat = this.autoSwat;
			break;
		}
	}

	this.autoSwat = false;
	this.balls.splice(b,1);
}

Player.prototype.removeBall = function(){
	for(var b in this.balls){
		if(this.balls[b].auth == this.ballReturn.ball.auth){
			this.ballReturn = null;
			if(!this.autoSwat){
				this.balls[b].changeSender({
					name: this.name,
					id: this.id
				});
				if(this.shield==null){
					this.swatCount++;
					this.experience += BALL_SWAT_EXP; //TODO: scale exp with time left on ball
				}
			}else{
				this.balls[b].changeSender(this.balls[b].sender);
				this.balltimeS += AUTO_SWAT_PUNISHMENT;
				this.score -= AUTO_SWAT_PUNISHMENT;
			}  

			//Update History
			for(var h = this.ballHistory.length-1; h > -1; h--){
				if(this.balls[b].auth == this.ballHistory[h].auth){
					this.ballHistory[h].removed = Date.now();
					this.ballHistory[h].autoSwat = this.autoSwat;
					break;
				}
			}
				
			this.autoSwat	= false;
			var ball = this.balls[b];
			this.balls.splice(b,1);
			return ball;
		}
	}
}

Player.prototype.sentTargetBall = function(){
	this.targetBalls--;
	this.targetBallsSent++;
	this.ballReturn = null;
}

Player.prototype.getBallCount = function(){
	return Math.max(this.balls.length - this.hasMoneyBall - this.curTargetBalls, 0);
}

Player.prototype.hasChange = function(){
	return this.change;
}

Player.prototype.gotChange = function(){
	this.change = false;
}

Player.prototype.getSocket = function(){
	return this.socket;
}

Player.prototype.getName = function(){
	return this.name;
}

Player.prototype.getLoginCreds = function(){
	return [this.email, this.password];
}

// Player.prototype.getAuth = function(){
// 	return this.authToken;
// }

Player.prototype.setSocket = function(socket){
	this.socket = socket;
}

Player.prototype.getBackColor = function(){
	return this.isActive?this.backColor:"#444";
}

Player.prototype.setActive = function(active){
	this.isActive = active;
}

Player.prototype.publicData = function(){
	return {
		id: 		this.id,
		name: 		this.name,
		score: 		this.score,
		isActive: 	this.isActive,
		ballCount:  this.balls.length - this.hasMoneyBall,
		// shield: 	this.shield,
		activeBoost:this.activeBoost
	};
}

module.exports = Player;