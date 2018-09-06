const Ball = require('./Ball');
const AGGRESIVE_SCORE = true;

//Experience
const NO_BALL_EXP = 1;
const BALL_SWAT_EXP = 50;

//Money ball
const MONEY_BALL_BASE_CHANCE = .05;
const MONEY_BALL_INCREASE_PER_CHECK = .005;
const MONEY_BALL_CHECK = 30;
const MONEY_BALL_MONEY_MAX = 40; //per minute left on ball

//Store
const MONEY_GAIN_CHECK = 20;
const MONEY_GAIN_AMOUNT = 1;
const TARGET_BALL_COST = 50;

//Auto Swat
const AUTO_SWAT_PUNISHMENT = 100;

function Player(id, auth, name){
	this.id 		= id;
	this.authToken	= auth;
	this.name 		= name;

	//Stats
	this.level		= 0;
	this.experience = 0;
	this.expPrev	= 0;
	this.nextLevel	= 220;
	this.lifetime 	= 0; //Total time spent
	this.activetime = 0; //Total time spent online
	this.score		= 0; //Time without ball or lifetime - balltimeS
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

	this.moneyBallChance = .25; //Chance of getting the moneyball
	this.hasMoneyBall = false;

	//Flags
	this.curTargetBalls = 0;
	this.showLvlUp  = false;
	this.ballReturn = null;
	this.isActive	= true;
	this.autoSwat	= false;
	this.menu		= [true,true,false,false,false]; //leaderboard, stats, vision, target, settings

	this.prevLeft = false;
}

Player.create = function(id,auth,name) {
  	
  	return new Player(id,auth,name);
}

Player.prototype.updateOnInput = function(keyboardState, mouseState, gameState){
	//Swat a ball
	if(gameState.auth != null && this.balls.length > 0 && this.ballReturn == null && mouseState.left){
		for(var b in this.balls){
			if(this.balls[b].auth == gameState.auth){
				if(this.balls[b].type != "NORMAL")
					this.removeTempBall(b);
				else
					this.ballReturn = {
						type: "RANDOM",
						ball: this.balls[b]
					};
				break;
			}
		}
	}

	//Send a ball to target
	if(this.money >= TARGET_BALL_COST && gameState.sendBall != null){
		this.ballReturn = {
			type: "TARGET",
			target: gameState.sendBall
		};
	}

	this.prevLeft = mouseState.left;
	this.backColor = gameState.backColor;
}

Player.prototype.update = function(){
	//Update Counters
	this.lifetime++;
	this.balltimeS += this.balls.length-this.hasMoneyBall;
	if(this.balls.length-this.hasMoneyBall > 0) this.balltime++;
	if(this.balls.length-this.hasMoneyBall == 0 && !AGGRESIVE_SCORE) this.score++;
	else if(AGGRESIVE_SCORE) this.score = this.lifetime - this.balltimeS;

	if(this.isActive) this.activetime++;

	//Check for moneyball
	if(this.lifetime%MONEY_BALL_CHECK==0 && !this.hasMoneyBall){
		var r = Math.random();
		// console.log(this.name,r,this.moneyBallChance);
		if(r <= this.moneyBallChance){
			this.moneyBallChance = MONEY_BALL_BASE_CHANCE;
			this.hasMoneyBall = true;
			this.moneyBallCount++;
			this.newBall(Ball.create("MONEY~MONEY~MONEY",{name:"~ROOT",id:"-1"},"MONEY"));
		}
		else this.moneyBallChance += MONEY_BALL_INCREASE_PER_CHECK;
	}

	//Check for money
	if(this.lifetime%MONEY_GAIN_CHECK==0) this.money+=MONEY_GAIN_AMOUNT;

	//Update balls
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
	}

	//Check leveling
	if(this.balls.length-this.hasMoneyBall == 0) this.experience+=NO_BALL_EXP;
	if(this.experience >= this.nextLevel) this.levelUp();
}

Player.prototype.levelUp = function(){
	const expNeed = [0,220,550,1100,6600,13200,26400,52800,105600,211200,422400];

	this.level++;
	this.expPrev = expNeed[this.level];
	this.nextLevel = expNeed[this.level+1];
	this.showLvlUp = true;

	//Give Rewards
	this.money += this.level * this.level * 10;

	if(this.level == 1) this.menu[2] = true; //Give vision
	if(this.level == 2) this.menu[3] = true; //Give targeting
	if(this.level == 3) this.menu[4] = true; //Give settings
}

Player.prototype.removingBall = function(){
	return this.ballReturn;
}

Player.prototype.newBall = function(ball){
	this.balls.push(ball);
	this.ballCount++;
	if(ball.type == "TARGET"){
		this.curTargetBalls++;
		this.targetBallCount++;
	} 
}

Player.prototype.removeTempBall = function(b){
	if(this.balls[b].type == "MONEY"){
		if(this.balls[b].curTime>0)
			this.money += (parseInt(this.balls[b].curTime/60)+1) * MONEY_BALL_MONEY_MAX;
		this.hasMoneyBall = false;
	}else if(this.autoSwat){
		this.balltimeS += AUTO_SWAT_PUNISHMENT;
	} 

	if(this.balls[b].type == "TARGET") this.curTargetBalls--;

	if(!this.autoSwat){
		this.swatCount++;
		this.experience += BALL_SWAT_EXP;
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
				this.swatCount++;
				this.experience += BALL_SWAT_EXP; //TODO: scale exp with time left on ball
			}else{
				this.balls[b].changeSender(this.balls[b].sender);
				this.balltimeS += AUTO_SWAT_PUNISHMENT;
			}  
				
			this.autoSwat	= false;
			var ball = this.balls[b];
			this.balls.splice(b,1);
			return ball;
		}
	}
}

Player.prototype.sentTargetBall = function(){
	this.money -= TARGET_BALL_COST;
	this.targetBallsSent++;
	this.ballReturn = null;
}

Player.prototype.getBallCount = function(){
	return this.balls.length - this.hasMoneyBall - this.curTargetBalls;
}

Player.prototype.getID = function(){
	return this.id;
}

Player.prototype.getName = function(){
	return this.name;
}

Player.prototype.getAuth = function(){
	return this.authToken;
}

Player.prototype.setID = function(id){
	this.id = id;
}

Player.prototype.getBackColor = function(){
	return this.isActive?this.backColor:"#444";
}

Player.prototype.setActive = function(active){
	this.isActive = active;
}

module.exports = Player;