function Drawing(context) {
    this.context = context;
    this.wid = $("#canvas").width();
    this.hei = $("#canvas").height();
    this.scale = 1;
    this.BOX_SIZE = 500;

    this.backColor = {r:parseInt(Math.random()*255),g:parseInt(Math.random()*255),b:parseInt(Math.random()*255)};
    this.colorGoal = {r:parseInt(Math.random()*255),g:parseInt(Math.random()*255),b:parseInt(Math.random()*255)};

    this.ballList = [];
    this.ballsClicked = 0;

    //Flags
    this.ballVision = false;
    this.curView = null;
    this.changeView = null;

    this.loadImages();
}

Drawing.create = function(context) {
    return new Drawing(context);
}

Drawing.prototype.newBall = function(auth){
    this.ballList.push(new Ball(auth,this.BOX_SIZE,this.BOX_SIZE));
}

Drawing.prototype.removeBall = function(auth){
    for(var b in this.ballList){
        if(this.ballList[b].auth == auth){
            this.ballList.splice(b,1);
            this.ballsClicked++;
            break;
        }
    }
}

//**************************************************************************
//Drawing
//**************************************************************************
Drawing.prototype.drawBackground = function(){
    this.transitionColor();

    //Background
    this.context.beginPath();
    this.context.fillStyle = "rgb("+this.backColor.r+","+this.backColor.g+","+this.backColor.b+")";
    this.context.fillRect(0,0,this.wid,this.hei);
    this.context.fill();

    //Website Title
    this.context.beginPath();
    this.context.fillStyle = "#FFF";
    this.context.font = "Bold "+80*this.scale+"px Arial";
    this.context.fillText("KEEP OUT",40*this.scale,270*this.scale);
    this.context.fill();

    //Instructions
    if(this.ballsClicked < 2){
        this.context.beginPath();
        this.context.fillStyle = "#FFF";
        this.context.font = ""+20*this.scale+"px Arial";
        this.context.fillText("Click the ball to keep it out of your box.",70*this.scale,295*this.scale);
        this.context.fill();
    }
}

Drawing.prototype.drawMenuItems = function(menuItems, mouse, click){
    var itemCount   = 0, 
        itemSize    = 20, 
        edgeSpace   = 15,
        placeY      = 10,
        startX      = 0;

    for(var m in menuItems) 
        itemCount += menuItems[m];

    var spacing = (this.BOX_SIZE-edgeSpace*2)/itemCount;
    startX = spacing/2 - itemSize/2;

    const imgs = [{img:this.leaderboardImg, view:"leaderboard"},
                  {img:this.statsImg, view:"stats"},
                  {img:this.ballVision?this.vision_onImg:this.vision_offImg, view:"ball"},
                  {img:this.settingsImg, view:"settings"}];
    var index = 0;
    for(var m in menuItems){
        this.context.beginPath();
        if(menuItems[m]){
            if(mouse.x > edgeSpace+spacing*index && mouse.x < edgeSpace+spacing*(index+1)){
                this.context.fillStyle = "rgba(0,0,255,.2)";
                this.context.fillRect((edgeSpace+spacing*index)*this.scale,0,spacing*this.scale,40*this.scale);
                this.context.fill();

                if(click) this.changeView = imgs[m].view;
            }
            this.context.drawImage(imgs[m].img,(edgeSpace+startX+spacing*index)*this.scale,placeY*this.scale,itemSize*this.scale,itemSize*this.scale);
            index++;
            this.context.fill();
        }
    }
}

Drawing.prototype.drawBalls = function(){
    for(var b in this.ballList){
        this.ballList[b].move(this.scale);
        this.ballList[b].bounce(this.BOX_SIZE, this.BOX_SIZE);

        this.context.beginPath();
        this.context.fillStyle = "#000";
        this.context.arc(this.ballList[b].x*this.scale,this.ballList[b].y*this.scale,this.ballList[b].size*this.scale,0,2*Math.PI);
        this.context.fill();
    }
}


//**************************************************************************
//Menus
//**************************************************************************
Drawing.prototype.drawAlternateView = function(user,list){
    //Chnage the view
    if(this.changeView == "ball"){
        this.ballVision = !this.ballVision;
        this.changeView = null;
    }
    else if(this.changeView != null){
        this.curView = this.changeView==this.curView?null:this.changeView;
        this.changeView = null;
    }

    //draw the current view
    if(this.curView == "leaderboard") this.drawLeaderboard(user, list);
    else if(this.curView == "stats") this.drawStats(user, list);
    else if(this.curView == "settings") this.drawSettings(user);
    else if(this.ballVision) this.drawBallHolders(list);
}

Drawing.prototype.drawLeaderboard = function(user, list){
    this.context.beginPath();

    //Background overlay
    this.context.fillStyle = "rgba(0,0,0,.6)";
    this.context.fillRect(0,0,this.BOX_SIZE*this.scale,this.BOX_SIZE*this.scale);

    var fontSize = 32;
    this.context.fillStyle = "#FFF";

    //Sort list
    list.sort(function(a,b){
        if(a.score < b.score) return 1;
        else if(a.score > b.score) return -1;
        else{
            //same score
            if(a.name < b.name) return 1;
            if(a.name > b.name) return -1;
            return 0;
        } 
    });

    //Display top 10
    var startX = 20, startY = 60;
    this.context.font = ""+22*this.scale+"px Arial";
    this.context.fillText("#",startX*this.scale,startY*this.scale);
    this.context.fillText("[LVL] NAME",(startX+70)*this.scale,startY*this.scale);
    this.context.fillText("SCORE",(startX+360)*this.scale,startY*this.scale);

    startY = 60;
    var rank = 1, inserted = false;
    for(var r = 0; r < Math.min(10,list.length+inserted); r++){
        this.context.font = ""+fontSize*this.scale+"px Arial";

        var current = list[r-inserted];

        //Set Rank
        if((r-inserted > 0 && current.score != list[r-inserted-1].score) || (inserted && current.score != user.score)) rank = r+1;

        //Check to see if user is in the top 10
        if(!inserted && current.score <= user.score){
            inserted = true;
            this.context.font = "Bold "+(fontSize)*this.scale+"px Arial";
            this.context.fillText(rank, startX*this.scale,((r+1)*fontSize+5+startY)*this.scale);
            this.context.fillText("["+user.level+"] "+user.name,(startX+70)*this.scale,((r+1)*fontSize+5+startY)*this.scale);
            this.context.fillText(user.score,(startX+360)*this.scale,((r+1)*fontSize+5+startY)*this.scale);
        }
        else{
            this.context.fillText(rank,startX*this.scale,((r+1)*fontSize+5+startY)*this.scale);
            this.context.fillText("["+current.level+"] "+current.name,(startX+70)*this.scale,((r+1)*fontSize+5+startY)*this.scale);
            this.context.fillText(current.score,(startX+360)*this.scale,((r+1)*fontSize+5+startY)*this.scale);
        }
    }

    //User is either bottom of list or not top ten
    if(!inserted){
        rank = Math.min(10,list.length)+1;
        var bRank = rank;
        var extra = bRank>10?40:0;

        for(var r = rank-1; r < list.length; r++){
            if(list[r].score <= user.score) break;
            rank++;
        }

        //dots
        if(extra){
            this.context.beginPath();
            this.context.arc(this.BOX_SIZE/2*this.scale,(bRank*fontSize+5+40)*this.scale,4*this.scale,0,2*Math.PI);
            this.context.arc(this.BOX_SIZE/2*this.scale,(bRank*fontSize+5+40+12)*this.scale,4*this.scale,0,2*Math.PI);
            this.context.arc(this.BOX_SIZE/2*this.scale,(bRank*fontSize+5+40+24)*this.scale,4*this.scale,0,2*Math.PI);
            this.context.fill();
        }

        this.context.font = "Bold "+(fontSize)*this.scale+"px Arial";
        this.context.fillText(rank, startX*this.scale,(bRank*fontSize+5+60+extra)*this.scale);
        this.context.fillText("["+user.level+"] "+user.name,(startX+70)*this.scale,(bRank*fontSize+5+60+extra)*this.scale);
        this.context.fillText(user.score,(startX+360)*this.scale,(bRank*fontSize+5+60+extra)*this.scale);
    }    
    this.context.fill();
}

Drawing.prototype.drawStats = function(user){
    this.context.beginPath();
    this.context.fillStyle = "rgba(0,0,0,.6)";
    this.context.fillRect(0,0,this.BOX_SIZE*this.scale,this.BOX_SIZE*this.scale);
}

Drawing.prototype.drawBallHolders = function(list){
    var fontSize = 10;

    this.context.beginPath();
    this.context.fillStyle = "#FFF";
    this.context.font = "Bold "+fontSize*this.scale+"px Arial";

    var ballHolderCount = 0;
    for(var l = 0; l < list.length; l++)
        if(list[l].balls.length > 0){
            this.context.fillText(list[l].name+" ["+list[l].balls.length+"]",10*this.scale,(this.BOX_SIZE-(ballHolderCount)*fontSize-5)*this.scale);
            ballHolderCount++;
        }
    this.context.fill();
}

Drawing.prototype.drawSettings = function(user){
    this.context.beginPath();
    this.context.fillStyle = "rgba(0,0,0,.6)";
    this.context.fillRect(0,0,this.BOX_SIZE*this.scale,this.BOX_SIZE*this.scale);
}

//**************************************************************************
//Util
//**************************************************************************
Drawing.prototype.setScale = function(scale){
    this.scale = scale/this.BOX_SIZE;
}

Drawing.prototype.clear = function() {
    var canvas = this.context.canvas;
    this.context.clearRect(0, 0, canvas.width, canvas.height);
    this.context.fillStyle = '#000';
    this.context.fillRect(0, 0, canvas.width, canvas.height);
}

Drawing.prototype.resize = function(){
    const widthToHeight = 1080 / 1080;
    var newWidth = window.innerWidth;
    var newHeight = window.innerHeight;

    var newWidthToHeight = newWidth / newHeight;

    if(newWidthToHeight > widthToHeight){
        newWidth = newHeight * widthToHeight;
    }
    else{
        newHeight = newWidth / widthToHeight;
    }

    $("#gameArea").css({
        "height":newHeight+"px",
        "width":newWidth+"px",
        "margin-top": (-newHeight / 2) + "px",
        "margin-left": (-newWidth / 2) + "px"
    });

    $("#canvas").attr("width",newWidth+"px");
    $("#canvas").attr("height",newHeight+"px");

    this.wid = $("#canvas").width();
    this.hei = $("#canvas").height();
}

Drawing.prototype.transitionColor = function(){
    const inc = .5;

    if( this.backColor.r == this.colorGoal.r && 
        this.backColor.g == this.colorGoal.g && 
        this.backColor.b == this.colorGoal.b){
        this.colorGoal = {r:parseInt(Math.random()*255),g:parseInt(Math.random()*255),b:parseInt(Math.random()*255)};
    }

    if(this.colorGoal.r > this.backColor.r) this.backColor.r+=inc;
    else if(this.colorGoal.r < this.backColor.r) this.backColor.r-=inc;

    if(this.colorGoal.g > this.backColor.g) this.backColor.g+=inc;
    else if(this.colorGoal.g < this.backColor.g) this.backColor.g-=inc;

    if(this.colorGoal.b > this.backColor.b) this.backColor.b+=inc;
    else if(this.colorGoal.b < this.backColor.b) this.backColor.b-=inc;
}

Drawing.prototype.loadImages = function(){
    //Menu images
    this.leaderboardImg     = new Image;
    this.leaderboardImg.src = "/images/leaderboard.png";
    this.statsImg           = new Image;
    this.statsImg.src       = "/images/stats.png";
    this.settingsImg        = new Image;
    this.settingsImg.src    = "/images/settings.png";
    this.vision_onImg       = new Image;
    this.vision_onImg.src   = "/images/vision_on.png";
    this.vision_offImg      = new Image;
    this.vision_offImg.src  = "/images/vision_off_v2.png";
}