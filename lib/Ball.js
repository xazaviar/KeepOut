const MAX_TIME = 600;

function Ball(auth, sender, type){
	this.auth		= auth;
	this.sender		= sender; //name and id
	this.type		= type;

	if(type=="TARGET")
		this.curTime= MAX_TIME*2;
	else if(type=="MONEY")
		this.curTime= MAX_TIME/2;
	else
		this.curTime= MAX_TIME;
}

Ball.create = function(auth, sender, type) {
  	
  	return new Ball(auth,sender,type);
}

Ball.prototype.changeSender = function(sender){
	this.sender = sender;
	this.curTime = MAX_TIME;
}

Ball.prototype.update = function(){
	this.curTime--;
}

Ball.prototype.doAutoSwat = function(){
	return this.curTime <= 0;
}

module.exports = Ball;