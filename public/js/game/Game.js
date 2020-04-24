function Game(socket, drawing){
    this.socket = socket;
    this.drawing = drawing;

    this.user 				= null;
    this.playerList 		= [];
    this.animationFrameId 	= 0;
    this.prevLeft			= false;

    this.clickedBall		= false;

    this.recentBalls        = [];

    this.reconnectAttempts  = 10;

    this.lastInput = Date.now();

    this.gameRules = null;
    this.gotLvlup = false;
    this.prevLevelup = false;

    var context = this;
    setInterval(function(){
        context.drawing.ticks++;

        if(Date.now() - context.lastInput > 10*60*1000){
            console.log("FORCE RESET");
            location.reload();
        }

        context.constUpdate();
    },1000);

    $("body").on("click", function(){
        context.lastInput = Date.now();
    });
    $("body").on("touch", function(){
        context.lastInput = Date.now();
    });
}

Game.create = function(socket, canvasElement) {
    // var canvasContext = canvasElement.getContext('2d');

    var drawing = Drawing_html.create();
    return new Game(socket, drawing);
}

Game.prototype.init = function(email, password) {
    var context = this;

    this.socket.on('update', function(data) {
        context.receiveGameState(data);
    });
    this.socket.on('initial', function(data) {
        context.user  = data['self'];
        context.otherPlayers = data['players'];
        context.gameRules = data['rules'];
        context.reconnectAttempts = 10;
        console.log("Connected to the game");
    });
    this.socket.on('failed-connect', function(data) {
        //Must be bad credentials, send them back to sign in
        
        //Remove old creds
        localStorage.removeItem("email");
        localStorage.removeItem("password");

        //Redirect
        window.location.assign(window.location.origin);
    });

    this.socket.on('connect_error', function(err){
        console.log("Attempting to reconnect [Attempts left: "+context.reconnectAttempts+"]");

        if(context.reconnectAttempts==10) //Initial connection attempt. Let it hang.
            context.socket.emit('player-connect', {
                email: email,
                password: password
            });


        context.reconnectAttempts--;
    });


    //Connect to the server
    this.socket.emit('player-connect', {
        email: email,
        password: password
    });
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
                if(updates[u].id == this.otherPlayers[o].id){
                    this.otherPlayers[o].isActive = true;
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

    //Check for levelup
    if(this.user.showLvlUp && !this.prevLevelup){
        this.gotLvlup = true;
        this.prevLevelup = true;
    }else if(!this.user.showLvlUp && this.prevLevelup){
        this.prevLevelup = false;
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
            storePurchase: this.drawing.storePurchase,
            gotLvlup: this.gotLvlup 
        }
    });
    //Reset variables
    this.clickedBall = null;
    this.drawing.ballTarget = null;
    this.drawing.storePurchase = null;

    if(this.drawing.madeInput){
        this.drawing.madeInput = false;
        this.lastInput = Date.now();
    }

    this.draw();
    this.animate();
}

Game.prototype.draw = function() {
	//Resize the canvas
    if(this.user)
        this.drawing.resize(this.user.menu);

    //Draw background
    this.drawing.drawBackground();

    //Draw balls
    this.drawing.drawBalls();

    //Draw level up
    // console.log("SHOW LEVEL UP: ",this.gotLvlup && Date.now()-this.lastLevelup<10)
    if(this.gotLvlup && !this.drawing.showingLevelup){
        this.drawing.drawLevelUp();
        this.gotLvlup = false;
    }else if(this.gotLvlup) this.gotLvlup = false;

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
        if(this.user.activeBoost.dur > 0) this.user.activeBoost.dur--;
        else this.user.activeBoost = {amt:this.gameRules.BASE_POINT_GAIN,dur:-1};

        //Update Counters
        this.user.lifetime++;
        this.user.balltimeS += this.user.balls.length-this.user.hasMoneyBall;
        if(this.user.balls.length-this.user.hasMoneyBall > 0) this.user.balltime++;
        this.user.score += this.user.activeBoost.amt + (this.user.balls.length-this.user.hasMoneyBall)*this.gameRules.BALL_POINT_COST;

        //Score records
        if(this.user.score > this.user.highScore) this.user.highScore = 0+this.user.score;
        if(this.user.score < this.user.lowScore) this.user.lowScore = 0+this.user.score;

        if(this.user.isActive) this.user.activetime++;

        if(this.user.balls.length-this.user.hasMoneyBall == 0) this.user.experience+=this.gameRules.NO_BALL_EXP; //Need to pull from file

        //Update others
        for(var o in this.otherPlayers){
            var player = this.otherPlayers[o];
            player.score += player.activeBoost.amt + player.ballCount*this.gameRules.BALL_POINT_COST;
        }

        this.recentBalls = [];
    }

    //Check for disconnected
    if(this.reconnectAttempts<0){
        location.reload(); //Forced reconnect
    }
}

Game.prototype.animate = function() {
    this.animationFrameId = window.requestAnimationFrame(
        this.bind(this, this.update));
}

Game.prototype.stopAnimation = function() {
    window.cancelAnimationFrame(this.animationFrameId);
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