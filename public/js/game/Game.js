function Game(socket, drawing){
    this.socket = socket;
    this.drawing = drawing;

    this.user 				= null;
    this.playerList 		= [];
    this.animationFrameId 	= 0;
    this.prevLeft			= false;

    this.clickedBall		= false;
    this.firstData 			= true;

    this.recentClick        = false;

    this.saveAuth           = true;
}

Game.create = function(socket, canvasElement) {
    var canvasContext = canvasElement.getContext('2d');

    var drawing = Drawing.create(canvasContext);
    return new Game(socket, drawing);
}

Game.prototype.init = function(name, auth) {
    var context = this;

    this.socket.on('update', function(data) {
        context.receiveGameState(data);
    });
    this.socket.emit('player-connect', {
    	name: name,
    	auth: auth
    });
    this.socket.on('failed-connect', function(data) {
        name = prompt("Could not find token on server. Please enter your name:");
        if (name == null || name == "") {
            name = "???";
        }
        context.socket.emit('player-connect', {
            name: name,
            auth: ""
        });
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
    this.user  = state['self'];
    this.otherPlayers = state['players'];

    // console.log(this.user);

    if(!this.recentClick){
        //Correct balls
        for(var o = 0; o < this.drawing.ballList.length; o++)
            this.drawing.ballList[o].keep = false;

        for(var b in this.user.balls){
            var ball = this.user.balls[b];

            var newBall = true;
            for(var o = 0; o < this.drawing.ballList.length; o++){
                if(this.drawing.ballList[o].auth == ball.auth){
                    this.drawing.ballList[o].keep = true;
                    newBall = false;
                    break;
                }
            }

            if(newBall) this.drawing.newBall(ball.auth);
        }

        //Remove bad balls
        for(var o = 0; o < this.drawing.ballList.length; o++){
            if(!this.drawing.ballList[o].keep) 
                this.drawing.removeBall(this.drawing.ballList[o].auth);
        }
    }
    else this.recentClick = false;
    

    //Create cookie
	if(this.firstData && this.saveAuth){
		var now = new Date();
		now.setMonth(now.getMonth() + 1);
		document.cookie = "auth="+this.user.authToken+"; expires="+now;
		this.firstData = false;
        console.log("first");
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
            auth:       this.clickedBall,
            backColor:  this.drawing.backColor,  
        	returnType: "random"
        }
    });
    //Reset variables
    this.clickedBall = null;

    this.draw();
    this.checkInput();
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

    //Draw balls
    this.drawing.drawBalls();

    //Draw Alternate Screens
    if(this.user) {
        this.drawing.drawAlternateView(this.user, this.otherPlayers);

        //Draw Menu Items
        var mAdj = this.calculateMouseCoords(Input.MOUSE[0],Input.MOUSE[1],this.drawing.scale);
        if(mAdj.y < 40) this.drawing.drawMenuItems(this.user.menu, mAdj, Input.LEFT_CLICK && !this.prevLeft);
    }
}

Game.prototype.checkInput = function(){
    //Check for ball connect
    var mAdj = this.calculateMouseCoords(Input.MOUSE[0],Input.MOUSE[1],this.drawing.scale);
    if(Input.LEFT_CLICK && !this.prevLeft){
        for(var b in this.drawing.ballList){
            if(this.drawing.ballList[b].clicked(mAdj)){
                this.clickedBall = this.drawing.ballList[b].auth;
                this.drawing.removeBall(this.clickedBall); //Immediate remove
                this.recentClick = true;
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