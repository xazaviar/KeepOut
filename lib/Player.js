const Ball = require('./Ball');
const AGGRESIVE_SCORE = true;

//Experience
const NO_BALL_EXP = 1;
const BALL_SWAT_EXP = 50;

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
	this.swatCount  = 0; //Total number of balls swatted away
	this.backColor	= "#000";
	this.money		= 0;

	//Flags
	this.showLvlUp  = false;
	this.ballReturn = null;
	this.isActive	= true;
	this.autoSwat	= false;
	this.menu		= [true,true,true,false]; //leaderboard, stats, vision, settings

	this.prevLeft = false;
}

Player.create = function(id,auth,name) {
  	
  	return new Player(id,auth,name);
}

Player.prototype.updateOnInput = function(keyboardState, mouseState, gameState){
	if(gameState.auth != null && this.balls.length > 0 && this.ballReturn == null && mouseState.left){
		for(var b in this.balls){
			if(this.balls[b].auth == gameState.auth){
				this.ballReturn = {
					type: gameState.returnType,
					ball: this.balls[b]
				};
				break;
			}
		}
	}

	this.prevLeft = mouseState.left;
	this.backColor = gameState.backColor;
}

Player.prototype.update = function(){
	//Update Counters
	this.lifetime++;
	this.balltimeS += this.balls.length;
	if(this.balls.length > 0) this.balltime++;
	if(this.balls.length == 0 && !AGGRESIVE_SCORE) this.score++;
	else if(AGGRESIVE_SCORE) this.score = this.lifetime - this.balltimeS;

	if(this.isActive) this.activetime++;

	//Update balls
	for(var b in this.balls){
		this.balls[b].update();
		if(this.balls[b].doAutoSwat()){
			this.ballReturn = {
				type: "random",
				ball: this.balls[b]
			};
		}
	}

	//Check leveling
	if(this.balls.length == 0) this.experience+=NO_BALL_EXP;
	if(this.experience >= this.nextLevel) this.levelUp();
}

Player.prototype.levelUp = function(){
	const expNeed = [0,220,550,1100,6600,13200,26400,52800,105600,211200,422400];

	this.level++;
	this.expPrev = expNeed[this.level];
	this.nextLevel = expNeed[this.level+1];
	this.showLvlUp = true;
}

Player.prototype.removingBall = function(){
	return this.ballReturn;
}

Player.prototype.newBall = function(ball){
	this.balls.push(ball);
	this.ballCount++;
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
			}else this.balltime += 100;
				
			this.autoSwat	= false;
			var ball = this.balls[b];
			this.balls.splice(b,1);
			return ball;
		}
	}
}

Player.prototype.getBalls = function(){
	return this.balls;
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