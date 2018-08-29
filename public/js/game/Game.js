function Game(socket, drawing){
    this.socket = socket;
    this.drawing = drawing;

    this.self 				= null;
    this.playerList 		= [];
    this.animationFrameId 	= 0;
    this.prevBalls 			= 0;
    this.prevLeft			= false;

    this.clickedBall		= false;
}

Game.create = function(socket, canvasElement) {
    var canvasContext = canvasElement.getContext('2d');

    var drawing = Drawing.create(canvasContext);
    return new Game(socket, drawing);
}

Game.prototype.init = function(name) {
    var context = this;

    this.socket.on('update', function(data) {
        context.receiveGameState(data);
    });
    this.socket.emit('player-connect', {
    	name: name
    });
}

Game.prototype.animate = function() {
    this.animationFrameId = window.requestAnimationFrame(
        this.bind(this, this.update));
}

Game.prototype.stopAnimation = function() {
    window.cancelAnimationFrame(this.animationFrameId);
}

Game.prototype.receiveGameState = function(state) {
    this.self  = state['self'];
    this.otherPlayers = state['players'];

    if(this.prevBalls < this.self.balls){
    	for(this.prevBalls; this.prevBalls < this.self.balls;){
    		this.drawing.newBall();
    		this.prevBalls++;
    	}
    }
    this.prevBalls = this.self.balls;

    //Check for too many balls
    if(this.prevBalls < this.drawing.ballList.length){
		this.drawing.ballList.splice(0,1);
	}
}

Game.prototype.update = function() {
	this.socket.emit('player-action', {
        keyboardState: {
            misc:       Input.MISC_KEYS
        },
        mouseState: {
            left:       Input.LEFT_CLICK,
            middle: 	Input.MIDDLE_CLICK,
            right:      Input.RIGHT_CLICK
        },
        gameState: {
        	clickedBall: this.clickedBall,
        	returnType:  "random"
        }
    });
    //Reset variables
    this.clickedBall = false;


    this.draw();
    this.animate();
}

Game.prototype.draw = function() {
	//Resize the canvas
    this.drawing.resize();

	// Clear the canvas
    this.drawing.clear();

    //Set scale
    this.drawing.setScale($("#gameArea").width());

    //Draw background
    this.drawing.drawBackground();

    //Draw players
    if(this.self)
 		this.drawing.drawPlayerList(this.self,this.otherPlayers);

    //Draw balls
    this.drawing.drawBalls();

    //Check for ball connect
    var mAdj = this.calculateMouseCoords(Input.MOUSE[0],Input.MOUSE[1],this.drawing.scale);
    if(Input.LEFT_CLICK && !this.prevLeft){
    	for(var b in this.drawing.ballList){
    		if(this.drawing.ballList[b].clicked(mAdj)){
    			this.clickedBall = true;
    			this.drawing.ballList.splice(b,1);
    			break;
    		}
    	}
    }

    this.prevLeft = Input.LEFT_CLICK;
}


//**************************************************************************
//Util
//**************************************************************************
Game.prototype.bind = function(context, method) {
    return function() {
        return method.apply(context, arguments);
    }
}

Game.prototype.calculateMouseCoords = function(x, y, scale){
    var cWid = $("#canvas").width();
    var cHei = $("#canvas").height();
    var wWid = window.innerWidth;
    var wHei = window.innerHeight;
    var sepWid = (wWid - cWid)/2;
    var sepHei = (wHei - cHei)/2;
    var mX, mY; 
    mX = (x - sepWid)/scale;
    mY = (y - sepHei)/scale;

    return {x:mX, y:mY};
}