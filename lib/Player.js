const Ball = require('./Ball');

//Experience
const NO_BALL_EXP = 1;
const BALL_SWAT_EXP = 50;

//Money ball
const MONEY_BALL_BASE_CHANCE = .05;
const MONEY_BALL_INCREASE_PER_CHECK = .005;
const MONEY_BALL_CHECK = 60;
const MONEY_BALL_MONEY_MAX = 50; //per minute left on ball

//Money
const MONEY_GAIN_CHECK = 20;
const MONEY_GAIN_AMOUNT = 1;

//Store
const TARGET_BALL_COST 			= 100;
const SHIELD_HIT_BALL_COST 		= 800;
const SHIELD_TIME_BALL_COST 	= 2000;
const X2_BOOST_BALL_COST 		= 650;
const X3_BOOST_BALL_COST 		= 900;
const X4_BOOST_BALL_COST 		= 1100;

//Store Items
const SHIELD_HITS = 10;
const SHIELD_TIME = 300; //5 Minutes
const BOOST_TIME  = 180; //3 Minutes

//Auto Swat
const AUTO_SWAT_PUNISHMENT = 100;

//Dev Mode
const DEV_MODE = true;

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
	this.moneyTotal = this.money;

	this.moneyBallChance = .25; //Chance of getting the moneyball
	this.hasMoneyBall = false;

	//Store Items
	this.activeBoost = {amt:1,dur:-1};
	this.shield = null; //Type, dur/hits
	this.targetBalls = 0;


	//Flags
	this.curTargetBalls = 0;
	this.showLvlUp  = false;
	this.newItemsInStore = 0;
	this.ballReturn = null;
	this.isActive	= true;
	this.autoSwat	= false;
	this.menu		= [true,true,false,false,false,false]; //leaderboard, stats, vision, target, store, settings
	this.store		= [
						{
							id: 0,
							name: "Target Ball",
							type: "ball",
							desc: "Use this ball in the Targeting Tab to send a surprise to an unspecting target. Or even a suspecting target; your ball your call..",
							cost: TARGET_BALL_COST,
							available: false
						},
						{
							id: 1,
							name: "Timed Shield",
							type: "shield",
							desc: "This shield will give you immunity to balls for "+(SHIELD_TIME/60).toFixed(0)+" minutes. Great item when you need to step away for just a bit.",
							cost: SHIELD_TIME_BALL_COST,
							available: false
						},
						{
							id: 2,
							name: "Hits Shield",
							type: "shield",
							desc: "Don't want to get slammed? Feel the heat coming soon and want to stop it? This shield will protect you from "+SHIELD_HITS+" balls. That'll show them.",
							cost: SHIELD_HIT_BALL_COST,
							available: false
						},
						{
							id: 3,
							name: "x2 Boost",
							type: "boost",
							desc: "Getting behind? Or want to increase the gap? Buy a boost! Guaranteed to increase your score for "+(BOOST_TIME/60).toFixed(0)+" minutes.",
							cost: X2_BOOST_BALL_COST,
							amt: 2,
							available: false
						},
						{
							id: 4,
							name: "x3 Boost",
							type: "boost",
							desc: "Still behind? Or want to establish dominance? Buy a better boost! Guaranteed to increase your score for "+(BOOST_TIME/60).toFixed(0)+" minutes.",
							cost: X3_BOOST_BALL_COST,
							amt: 3,
							available: false
						},
						{
							id: 5,
							name: "x4 Boost",
							type: "boost",
							desc: "Did you walk away for too long? Or want to make them feel weak? Buy the best boost! Guaranteed to increase your score for "+(BOOST_TIME/60).toFixed(0)+" minutes or your money back. (Refund window expires 2 seconds after purchase).",
							cost: X4_BOOST_BALL_COST,
							amt: 4,
							available: false
						}
					  ];

	this.prevLeft = false;

	if(DEV_MODE){
		this.level = 0;
		this.money = 10000000;
		this.moneyTotal = this.money;
		this.unlockAll();
	}
}

Player.create = function(id,auth,name) {
  	
  	return new Player(id,auth,name);
}

Player.prototype.unlockAll = function(){
	for(var m in this.menu)
		this.menu[m] = true;

	for(var i in this.store)
		this.store[i].available = true;
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
	if(this.targetBalls > 0 && gameState.sendBall != null){
		this.ballReturn = {
			type: "TARGET",
			target: gameState.sendBall
		};
	}

	//Purchase from Store
	if(gameState.storePurchase!=null){
		for(var s in this.store){
			var item = this.store[s];
			if(gameState.storePurchase == item.name){
				if(item.available && this.money >= item.cost){
					if(item.type == "ball"){
						this.money-=item.cost;
						this.targetBalls++;
					}
					else if(item.type == "shield" && this.shield == null){
						this.money-=item.cost;
						if(item.name=="Hits Shield"){
							this.shield={type:"hits",hits:SHIELD_HITS};
						}
						else if(item.name=="Timed Shield" ){
							this.shield={type:"time",dur:SHIELD_TIME};
						}
					}
					else if(item.name=="Hits Shield" && this.shield != null && this.shield.type=="hits"){
						this.money-=item.cost;
						this.shield.hits+=SHIELD_HITS;
					}
					else if(item.type == "boost" && this.activeBoost.amt==1){
						this.money-=item.cost;
						this.activeBoost = {amt:item.amt,dur:BOOST_TIME};
					}
				}
				break;
			}
		}
	}

	this.prevLeft = mouseState.left;
	this.backColor = gameState.backColor;
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
	if(this.lifetime%MONEY_GAIN_CHECK==0){
		this.money+=MONEY_GAIN_AMOUNT;
		this.moneyTotal+=MONEY_GAIN_AMOUNT;
	} 

	//Check leveling
	if(this.balls.length-this.hasMoneyBall == 0) this.experience+=NO_BALL_EXP;
	if(this.experience >= this.nextLevel) this.levelUp();
}

Player.prototype.levelUp = function(){
	const expNeed = [0,220,550,1100,6600,13200,26400,52800,105600,211200,422400];

	this.level++;
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

	if(this.level == 1){//Give vision
		this.menu[2] = true; 
	} 
	if(this.level == 2){//Give store and targetting
		this.menu[3] = true;
		this.menu[4] = true;
		this.store[0].available = true;
		this.newItemsInStore = 1;
		this.money += 200;
		this.moneyTotal += 200;
	}  
	if(this.level == 3){//Give Shields
		this.store[1].available = true;
		this.store[2].available = true;
		this.newItemsInStore = 2;
		this.money += 400;
		this.moneyTotal += 400;
	}    
	if(this.level == 5){//Give Boosts
		this.store[3].available = true;
		this.store[4].available = true;
		this.store[5].available = true;
		this.newItemsInStore = 3;
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
	}else if(this.autoSwat){
		this.balltimeS += AUTO_SWAT_PUNISHMENT;
	} 

	if(this.balls[b].type == "TARGET") this.curTargetBalls--;

	if(!this.autoSwat && this.shield==null){
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
				if(this.shield==null){
					this.swatCount++;
					this.experience += BALL_SWAT_EXP; //TODO: scale exp with time left on ball
				}
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
	this.targetBalls--;
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

Player.prototype.publicData = function(){
	return {
		id: 		this.id,
		name: 		this.name,
		score: 		this.score,
		isActive: 	this.isActive,
		ballCount:  this.balls.length - this.hasMoneyBall,
		shield: 	this.shield,
		activeBoost:this.activeBoost
	};
}

module.exports = Player;