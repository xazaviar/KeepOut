function Game(socket, drawing){
    this.socket = socket;
    this.drawing = drawing;

    this.user 				= null;
    this.playerList 		= [];
    this.animationFrameId 	= 0;
    this.prevLeft			= false;

    this.clickedBall		= false;
    this.firstData 			= true;

    this.recentBalls        = [];

    this.saveAuth           = false;

    var context = this;

    setInterval(function(){
        context.drawing.ticks++;
        context.constUpdate();
    },1000);
}

Game.create = function(socket, canvasElement) {
    // var canvasContext = canvasElement.getContext('2d');

    var drawing = Drawing_html.create();
    return new Game(socket, drawing);
}

Game.prototype.init = function(name, auth) {
    var context = this;

    this.socket.on('update', function(data) {
        context.receiveGameState(data);
    });
    this.socket.on('initial', function(data) {
        context.user  = data['self'];
        context.otherPlayers = data['players'];
    });
    this.socket.emit('player-connect', {
    	name: name,
    	auth: auth
    });
    this.socket.on('failed-connect', function(data) {
        // name = prompt("Could not find token on server. Please enter your name:");
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
    var updates = state['updates'];
    
    for(var u in updates){
        if(updates[u].type == "newPlayer"){
            // console.log("NEW PLAYER");
            if(updates[u].player.id != this.user.id)
                this.otherPlayers.push(updates[u].player);
        }
        else if(updates[u].type == "playerDisconnect"){
            for(var o in this.otherPlayers){
                if(updates[u].id == this.otherPlayers[o].id){
                    this.otherPlayers[o].isActive = false;
                    break;
                }  
            }
        }
        else if(updates[u].type == "playerReconnect"){
            for(var o in this.otherPlayers){
                if(updates[u].oldID == this.otherPlayers[o].id){
                    this.otherPlayers[o].isActive = true;
                    this.otherPlayers[o].id = updates[u].newID;
                    break;
                }  
            }
        }
        else if(updates[u].type == "playerChange"){
            // console.log("PLAYER CHANGE");
            for(var o in this.otherPlayers){
                if(updates[u].player.id == this.otherPlayers[o].id){
                    this.otherPlayers[o] = updates[u].player;
                    break;
                }  
            }
        }
        else if(updates[u].type == "selfChange"){
            // console.log("SELF CHANGE");
            this.user = updates[u].player;
        }
    }

    //Correct balls
    for(var o = 0; o < this.drawing.ballList.length; o++)
        this.drawing.ballList[o].keep = false;

    for(var b in this.user.balls){
        var ball = this.user.balls[b];

        //Check for recently click
        var recent = false;
        for(var r in this.recentBalls){
            if(ball.auth == this.recentBalls[r]){
                recent = true;
                break;
            }
        }

        if(!recent){
            var newBall = true;
            for(var o = 0; o < this.drawing.ballList.length; o++){
                if(this.drawing.ballList[o].auth == ball.auth){
                    this.drawing.ballList[o].keep = true;
                    newBall = false;
                    break;
                }
            }

            if(newBall) this.drawing.newBall(ball.sender, ball.auth, ball.type, this);
                
                     
        }
    }

    //Remove bad balls
    for(var o = 0; o < this.drawing.ballList.length; o++){
        if(!this.drawing.ballList[o].keep) 
            this.drawing.removeBall(this.drawing.ballList[o].auth);
    }
    

    //Create cookie
	if(this.firstData && this.saveAuth){
		var now = new Date();
		now.setMonth(now.getMonth() + 1);
		document.cookie = "auth="+this.user.authToken+"; expires="+now;
		this.firstData = false;
	}
}

Game.prototype.update = function() {
    // console.log("FRAME "+this.animationFrameId);

	this.socket.emit('player-action', {
        keyboardState: {
            misc:       Input.MISC_KEYS
        },
        mouseState: {
            left:       Input.LEFT_CLICK
        },
        gameState: {
            backColor:  this.drawing.backColor, 
            auth:       this.clickedBall,
            sendBall:   this.drawing.ballTarget,
            permTarget: this.drawing.permTarget,
            storePurchase: this.drawing.storePurchase
        }
    });
    //Reset variables
    this.clickedBall = null;
    this.drawing.ballTarget = null;
    this.drawing.storePurchase = null;

    this.draw();
    // this.checkInput();
    this.animate();
}

Game.prototype.draw = function() {
	//Resize the canvas
    if(this.user)
        this.drawing.resize(this.user.menu);

	// Clear the canvas
    // this.drawing.clear();

    //Set scale
    // this.drawing.setScale($("#gameArea").width());

    //Draw background
    this.drawing.drawBackground();

    //Draw balls
    this.drawing.drawBalls();

    //Draw Alternate Screens
    if(this.user)
        this.drawing.drawAlternateView(this.user, this.otherPlayers);
}

Game.prototype.checkInput = function(){
    //Check for ball connect
    var mAdj = this.calculateMouseCoords(Input.MOUSE[0],Input.MOUSE[1],this.drawing.scale);
    if(Input.LEFT_CLICK && !this.prevLeft){
        for(var b in this.drawing.ballList){
            if(this.drawing.ballList[b].clicked(mAdj)){
                this.clickedBall = this.drawing.ballList[b].auth;
                this.recentBalls.push(""+this.clickedBall);
                this.drawing.removeBall(this.clickedBall); //Immediate remove
                break;
            }
        }
    }

    this.prevLeft = Input.LEFT_CLICK;
}

//Updaters
Game.prototype.constUpdate = function(){
    // console.log("TICK "+this.drawing.ticks);

    if(this.otherPlayers.length > 0){
        //Update Self
        // if(this.user.activeBoost.dur > 0) this.user.activeBoost.dur--;
        // else this.user.activeBoost = {amt:1,dur:-1};

        // if(this.user.shield!=null)
        //     if(this.user.shield.type == "time" && this.user.shield.dur > 0) this.user.shield.dur--;
        //     else if(this.user.shield.type == "time") this.user.shield = null
        //     else if(this.user.shield.type == "hits" && this.user.shield.hits <= 0) this.user.shield = null;

        var activeShield = (this.user.shield != null && (this.user.shield.type=="time" || (this.user.shield.type=="hits" && this.user.shield.hits > 0)))

        //Update Counters
        this.user.lifetime++;
        if(!activeShield) this.user.balltimeS += this.user.balls.length-this.user.hasMoneyBall;
        if(!activeShield && this.user.balls.length-this.user.hasMoneyBall > 0) this.user.balltime++;
        // if(activeShield) this.user.score += this.user.activeBoost.amt;
        // else 
        this.user.score += this.user.activeBoost.amt - (this.user.balls.length-this.user.hasMoneyBall);

        //Score records
        if(this.user.score > this.user.highScore) this.user.highScore = 0+this.user.score;
        if(this.user.score < this.user.lowScore) this.user.lowScore = 0+this.user.score;

        if(this.user.isActive) this.user.activetime++;

        if(this.user.balls.length-this.user.hasMoneyBall == 0) this.user.experience+=1; //Need to pull from file


        //Update others
        for(var o in this.otherPlayers){
            var player = this.otherPlayers[o];

            // if(player.shield) player.score += player.activeBoost.amt;
            // else 
            player.score += player.activeBoost.amt - player.ballCount;
        }

        this.recentBalls = [];
    }
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