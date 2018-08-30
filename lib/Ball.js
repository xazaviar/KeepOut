const MAX_TIME = 600;

function Ball(auth, sender){
	this.auth		= auth;
	this.sender		= sender; //name and id
	this.curTime	= 0;
}

Ball.create = function(auth, sender) {
  	
  	return new Ball(auth,sender);
}

Ball.prototype.changeSender = function(sender){
	this.sender = sender;
	this.curTime = 0;
}

Ball.prototype.update = function(){
	this.curTime++;
}

Ball.prototype.doAutoSwat = function(){
	return this.curTime >= MAX_TIME;
}

module.exports = Ball;