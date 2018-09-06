function Ball(sender, auth, type, wid, hei){
	const speed = Math.random()*3+2;

	this.auth		= auth;
	this.x 			= parseInt(Math.random()*wid);
	this.y 			= parseInt(Math.random()*hei);
	this.direction 	= [(Math.random()*2-1)*speed,(Math.random()*2-1)*speed];
	this.size 		= 15;//Radius
	this.keep		= true;
	this.type		= type;
}

Ball.prototype.move = function(){
	this.x += this.direction[0];
	this.y += this.direction[1];
}

Ball.prototype.bounce = function(wid, hei){
	if(this.x+this.size >= wid){
		this.x = wid-this.size;
		this.direction[0] *= -1;
	}else if(this.x-this.size < 0){
		this.x = 0+this.size;
		this.direction[0] *= -1;
	} 

	if(this.y+this.size >= hei){
		this.y = hei-this.size;
		this.direction[1] *= -1;
	}else if(this.y-this.size < 0){
		this.y = 0+this.size;
		this.direction[1] *= -1;
	}
}

Ball.prototype.clicked = function(m){
	const extra = 5;
	return Math.pow(this.x-m.x,2) + Math.pow(this.y-m.y,2) <= Math.pow(this.size+extra,2);
}