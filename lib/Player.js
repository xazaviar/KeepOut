function Player(id, auth, name){
	this.id 		= id;
	this.authToken	= auth;
	this.name 		= name;
	this.score		= 0;
	this.lifetime 	= 0;
	this.balls		= 0;

	this.ballReturn = null;

	this.prevLeft = false;
}

Player.create = function(id,auth,name) {
  	
  	return new Player(id,auth,name);
};


Player.prototype.updateOnInput = function(keyboardState, mouseState, gameState){
	if(gameState.clickedBall && this.balls > 0 && this.ballReturn == null && mouseState.left){
		this.ballReturn = gameState.returnType;
	}

	this.prevLeft = mouseState.left;

}

Player.prototype.returningBall = function(){
	return this.ballReturn;
}

Player.prototype.newBall = function(){
	this.balls++;
}

Player.prototype.removeBall = function(){
	if(this.balls > 0){
		this.balls--;
		this.ballReturn = null;
	} 
}

Player.prototype.getBalls = function(){
	return this.balls;
}

Player.prototype.update = function(){
	//Update score
	this.score += this.balls;

	//Update lifetime
	this.lifetime++;
}

module.exports = Player;