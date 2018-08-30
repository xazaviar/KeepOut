const Ball = require('./Ball');

function Player(id, auth, name){
	this.id 		= id;
	this.authToken	= auth;
	this.name 		= name;

	//Counters
	this.lifetime 	= 0; //Total time spent
	this.activetime = 0; //Total time spent
	this.score		= 0; //Time without ball
	this.balltime	= 0; //Time spent with balls (stacked with multiple balls)
	this.balls		= [];//Ball list 

	//Flags
	this.ballReturn = null;
	this.isActive	= true;
	this.autoSwat	= false;

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
}

Player.prototype.update = function(){
	//Update Counters
	this.lifetime++;
	this.balltime += this.balls.length;
	if(this.balls.length == 0) this.score++;
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
}

Player.prototype.removingBall = function(){
	return this.ballReturn;
}

Player.prototype.newBall = function(ball){
	this.balls.push(ball);
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

Player.prototype.setActive = function(active){
	this.isActive = active;
}

module.exports = Player;