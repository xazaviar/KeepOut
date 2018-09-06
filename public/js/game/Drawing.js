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

    //Ball Target
    this.ballTarget = null;

    this.loadImages();

    //Ball Colors
    this.stdBallColor = "#000";
    this.targetBallColor = "#F00";
    this.moneyBallColor = "#FFD700";

    //Targeting drawing scroll bar
    this.maxTargetDisplay = 11;
    this.targetIndex = 0;
}

Drawing.create = function(context) {
    return new Drawing(context);
}

Drawing.prototype.newBall = function(sender, auth,  type){
    this.ballList.push(new Ball(sender,auth, type, this.BOX_SIZE,this.BOX_SIZE));
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
    if(this.curView==null){
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
                  {img:this.targetImg, view:"target"},
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
        //Move balls
        this.ballList[b].move(this.scale);
        this.ballList[b].bounce(this.BOX_SIZE, this.BOX_SIZE);

        //Color ball
        if(this.ballList[b].type == "TARGET") this.context.fillStyle = this.targetBallColor;
        else if(this.ballList[b].type == "MONEY") this.context.fillStyle = this.moneyBallColor;
        else this.context.fillStyle = this.stdBallColor;

        //Draw ball
        this.context.beginPath();
        this.context.arc(this.ballList[b].x*this.scale,this.ballList[b].y*this.scale,this.ballList[b].size*this.scale,0,2*Math.PI);
        this.context.fill();
    }
}


//**************************************************************************
//Menus
//**************************************************************************
Drawing.prototype.drawAlternateView = function(user,list,mouse,click){
    //Chnage the view
    if(this.changeView == "ball"){
        if(this.curView != null) this.ballVision = true;
        else this.ballVision = !this.ballVision;
        this.changeView = null;
        this.curView = null;
    }
    else if(this.changeView != null){
        this.curView = this.changeView==this.curView?null:this.changeView;
        this.changeView = null;
    }

    //draw the current view
    if(this.curView == "leaderboard") this.drawLeaderboard(user, list);
    else if(this.curView == "stats") this.drawStats(user, list);
    else if(this.curView == "settings") this.drawSettings(user, list);
    else if(this.curView == "target") this.drawTarget(user, list, mouse, click);
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
    var temp = rankPlayers(user, list);
    var rankings = temp[0];
    var userRank = temp[1];

    //Display top 10
    var startX = 20, startY = 60;
    this.context.font = ""+22*this.scale+"px Arial";
    this.context.fillText("#",startX*this.scale,startY*this.scale);
    this.context.fillText("[LVL] NAME",(startX+70)*this.scale,startY*this.scale);
    this.context.fillText("SCORE",(startX+360)*this.scale,startY*this.scale);

    startY = 60;
    var inserted = false;
    for(var r = 0; r < Math.min(10,rankings.length); r++){
        this.context.font = ""+fontSize*this.scale+"px Arial";
        if(rankings[r].name == user.name && rankings[r].score == user.score){
            inserted = true;
            this.context.font = "Bold "+(fontSize)*this.scale+"px Arial";
        }
        this.context.fillText(rankings[r].rank, startX*this.scale,((r+1)*fontSize+5+startY)*this.scale);
        this.context.fillText("["+rankings[r].level+"] "+rankings[r].name,(startX+70)*this.scale,((r+1)*fontSize+5+startY)*this.scale);
        this.context.fillText(rankings[r].score,(startX+360)*this.scale,((r+1)*fontSize+5+startY)*this.scale);
        
    }

    //User is either bottom of list or not top ten
    if(!inserted){
        var bRank = Math.min(10,list.length)+1;
        var extra = bRank>10?40:0;

        //dots
        if(extra){
            this.context.beginPath();
            this.context.arc(this.BOX_SIZE/2*this.scale,(bRank*fontSize+5+40)*this.scale,4*this.scale,0,2*Math.PI);
            this.context.arc(this.BOX_SIZE/2*this.scale,(bRank*fontSize+5+40+12)*this.scale,4*this.scale,0,2*Math.PI);
            this.context.arc(this.BOX_SIZE/2*this.scale,(bRank*fontSize+5+40+24)*this.scale,4*this.scale,0,2*Math.PI);
            this.context.fill();
        }

        this.context.font = "Bold "+(fontSize)*this.scale+"px Arial";
        this.context.fillText(userRank, startX*this.scale,(bRank*fontSize+5+60+extra)*this.scale);
        this.context.fillText("["+user.level+"] "+user.name,(startX+70)*this.scale,(bRank*fontSize+5+60+extra)*this.scale);
        this.context.fillText(user.score,(startX+360)*this.scale,(bRank*fontSize+5+60+extra)*this.scale);
    }    
    this.context.fill();
}

Drawing.prototype.drawStats = function(user, list){
    this.context.beginPath();
    this.context.fillStyle = "rgba(0,0,0,.7)";
    this.context.fillRect(0,0,this.BOX_SIZE*this.scale,this.BOX_SIZE*this.scale);

    var userRank = rankPlayers(user,list)[1];

    var startX = 10, startY = 70;

    //Base Info
    var fontSize = 30;
    this.context.font = "Bold "+(fontSize)*this.scale+"px Arial";
    this.context.fillStyle = "#FFF";
    this.context.fillText("NAME: "+user.name,startX*this.scale,startY*this.scale);
    fontSize = 20;
    this.context.font = "Bold "+(fontSize)*this.scale+"px Arial";
    this.context.fillText("RANK: "+userRank+"/"+(list.length+1),(startX)*this.scale,(startY+24)*this.scale);
    this.context.fillText("SCORE: "+user.score,(startX+160)*this.scale,(startY+24)*this.scale);

    //Leveling
    startY = 125;
    this.context.fillText(user.level,(startX)*this.scale,startY*this.scale);
    this.context.fillText((user.level+1),(480)*this.scale,startY*this.scale);
    this.context.fillText("Exp: "+user.experience,(startX)*this.scale,(startY+30)*this.scale);
    this.context.fillText("Next Level: "+user.nextLevel,(startX)*this.scale,(startY+50)*this.scale);

    //EXP bar
    this.context.fillRect((startX+15)*this.scale,(startY-15)*this.scale,3*this.scale,16*this.scale);
    this.context.fillRect((475)*this.scale,(startY-15)*this.scale,3*this.scale,16*this.scale);
    this.context.fillRect((startX+15)*this.scale,(startY-8.5)*this.scale,452*this.scale,3*this.scale);
    var exp = Math.min(450*(user.experience-user.expPrev)/(user.nextLevel-user.expPrev),450);
    this.context.fillRect((startX+15)*this.scale,(startY-12)*this.scale,exp*this.scale,9*this.scale);

    //Additional Stats
    startY = 200;
    this.context.fillText("Life time: "+convertSeconds(user.lifetime),(startX)*this.scale,(startY+=fontSize+2)*this.scale);
    this.context.fillText("Active time: "+convertSeconds(user.activetime),(startX)*this.scale,(startY+=fontSize+2)*this.scale);
    this.context.fillText("Ball time: "+convertSeconds(user.balltime),(startX)*this.scale,(startY+=fontSize+2)*this.scale);
    this.context.fillText("Ball time (stacked): "+convertSeconds(user.balltimeS),(startX)*this.scale,(startY+=fontSize+2)*this.scale);
    this.context.fillText("Time with balls: "+(user.balltime/Math.max(user.lifetime,1)*100).toFixed(2)+"%",(startX)*this.scale,(startY+=fontSize+2)*this.scale);
    this.context.fillText("Total Balls: "+(user.ballCount),(startX)*this.scale,(startY+=fontSize+2)*this.scale);
    this.context.fillText("Total Money Balls: "+(user.moneyBallCount),(startX)*this.scale,(startY+=fontSize+2)*this.scale);
    this.context.fillText("Total Target Balls: "+(user.targetBallCount),(startX)*this.scale,(startY+=fontSize+2)*this.scale);
    this.context.fillText("Total Target Balls Sent: "+(user.targetBallsSent),(startX)*this.scale,(startY+=fontSize+2)*this.scale);
    this.context.fillText("Total Swats: "+(user.swatCount),(startX)*this.scale,(startY+=fontSize+2)*this.scale);
    startY+=fontSize+2;
    this.context.fillText("Money: $"+(user.money),(startX)*this.scale,(startY+=fontSize+2)*this.scale);
}

Drawing.prototype.drawBallHolders = function(list){
    var fontSize = 20;

    this.context.beginPath();
    this.context.fillStyle = "#FFF";
    this.context.font = "Bold "+fontSize*this.scale+"px Arial";

    var ballHolderCount = 0;
    for(var l = 0; l < list.length; l++)
        if(list[l].balls.length-list[l].hasMoneyBall > 0){
            this.context.fillText(list[l].name+" ["+(list[l].balls.length-list[l].hasMoneyBall)+"]",10*this.scale,(this.BOX_SIZE-(ballHolderCount)*fontSize-5)*this.scale);
            ballHolderCount++;
        }
    this.context.fill();
}

Drawing.prototype.drawTarget = function(user, list, mouse, click){
    this.context.beginPath();
    this.context.fillStyle = "rgba(0,0,0,.6)";
    this.context.fillRect(0,0,this.BOX_SIZE*this.scale,this.BOX_SIZE*this.scale);

    var startX = 10, startY = 40;

    var fontSize = 40;
    this.context.fillStyle = "#FFF";
    this.context.font = "Bold "+(fontSize)*this.scale+"px Arial";
    this.context.fillText("Targeting [$"+user.money+"]",(startX)*this.scale,(startY+=fontSize+2)*this.scale);
    fontSize = 23;
    this.context.font = ""+(fontSize)*this.scale+"px Arial";
    this.context.fillText("Select your target to send them a ball ($"+(50)+")",(startX)*this.scale,(startY+=fontSize+2)*this.scale);

    //Draw List
    list.sort(function(a,b){
        if(a.name.toUpperCase() > b.name.toUpperCase()) return 1;
        else if(a.name.toUpperCase() < b.name.toUpperCase()) return -1;
        return 0;
    });

    var spacing = 10;
    fontSize = 22; startX = 60; startY += 10;
    this.context.font = "Bold "+(fontSize)*this.scale+"px Arial";
    this.context.fillText("NAME",(startX)*this.scale,(startY+=fontSize+2)*this.scale);
    this.context.fillText("SCORE",(startX+150)*this.scale,(startY)*this.scale);
    this.context.fillText("#",(startX+255)*this.scale,(startY)*this.scale);
    this.context.fillText("ACTIONS",(startX+300)*this.scale,(startY)*this.scale);

    fontSize = 20;
    this.context.font = ""+(fontSize)*this.scale+"px Arial";
    for(var l = this.targetIndex; l < Math.min(list.length,this.targetIndex+this.maxTargetDisplay); l++){
        this.context.fillText(list[l].name,(startX)*this.scale,(startY+=fontSize+spacing)*this.scale);
        this.context.fillText(list[l].score,(startX+155)*this.scale,(startY)*this.scale);
        this.context.fillText(list[l].balls.length-list[l].hasMoneyBall,(startX+255)*this.scale,(startY)*this.scale);

        //Draw Target Button
        var bigger = 0;
        if(mouse.x >= startX+340 && mouse.x <= startX+340+fontSize && mouse.y >= startY-(fontSize-3) && mouse.y <= startY+3){
            bigger = 10;
            if(click){
                //Send ball to target
                this.ballTarget = list[l].id;
            }
        }
        this.context.drawImage(this.targetImg,(startX+340-bigger/2)*this.scale,(startY-(fontSize-3)-bigger/2)*this.scale,(fontSize+bigger)*this.scale,(fontSize+bigger)*this.scale);
    }

    //Draw Arrows
    var arrowSize = 30;
    startX = 15; startY = 150;
    if(this.targetIndex > 0){
        //Draw up arrow
        this.context.drawImage(this.arrowUpImg,(startX)*this.scale,(startY)*this.scale,arrowSize*this.scale,arrowSize*this.scale);
        if(click && mouse.x >= startX && mouse.x <= startX+arrowSize && mouse.y >= startY && mouse.y <= startY+arrowSize){
            this.targetIndex = Math.max(this.targetIndex-1,0);
        }
    }
    if(list.length > this.targetIndex+this.maxTargetDisplay){
        //Draw down arrow
        this.context.drawImage(this.arrowDownImg,(startX)*this.scale,(450)*this.scale,arrowSize*this.scale,arrowSize*this.scale);
        if(click && mouse.x >= startX && mouse.x <= startX+arrowSize && mouse.y >= 450 && mouse.y <= 450+arrowSize){
            this.targetIndex = Math.min(this.targetIndex+1,list.length-this.maxTargetDisplay);
        }
    }
}

Drawing.prototype.drawSettings = function(user){
    this.context.beginPath();
    this.context.fillStyle = "rgba(0,0,0,.6)";
    this.context.fillRect(0,0,this.BOX_SIZE*this.scale,this.BOX_SIZE*this.scale);

    var startX = 10, startY = 40;

    var fontSize = 40;
    this.context.fillStyle = "#FFF";
    this.context.font = "Bold "+(fontSize)*this.scale+"px Arial";
    this.context.fillText("Settings",(startX)*this.scale,(startY+=fontSize+2)*this.scale);
    fontSize = 23;
    this.context.font = ""+(fontSize)*this.scale+"px Arial";
    this.context.fillText("Nice! You made it this far.",(startX)*this.scale,(startY+=fontSize+2)*this.scale);
    this.context.fillText("This is in progress. Probably will do colors here.",(startX)*this.scale,(startY+=fontSize+2)*this.scale);
    
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
    this.targetImg          = new Image;
    this.targetImg.src      = "/images/target.png";
    this.arrowUpImg         = new Image;
    this.arrowUpImg.src     = "/images/arrow_up.png";
    this.arrowDownImg       = new Image;
    this.arrowDownImg.src   = "/images/arrow_down.png";
}

function convertSeconds(sec){
    if(sec < 60) //One minute
        return ""+sec+"s";
    else if(sec < 60*60) //one hour
        return ""+(sec/60).toFixed(0)+" mins";
    else if(sec < 60*60*24) //one day
        return ""+(sec/(60*60)).toFixed(1)+" hours";
    else //More than 1 day
        return ""+(sec/(60*60*24)).toFixed(2)+" days";
}

function rankPlayers(user,list){
    var ranking = [];

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

    var rank = 1, inserted = false, userRank = 0;
    for(var r = 0; r < list.length+inserted; r++){
        var current = list[r-inserted];

        //Set Rank
        if(r > 0 && current.score != ranking[ranking.length-1].score) 
            rank = r+1;

        //Check to see if inserting user
        if(!inserted && current.score <= user.score){
            inserted = true;
            userRank = rank;
            ranking.push({
                rank: rank,
                name: user.name,
                score: user.score,
                level: user.level
            });
        }
        else{
            ranking.push({
                rank: rank,
                name: current.name,
                score: current.score,
                level: current.level
            });
        }

    }

    if(!inserted){
        if(ranking.length > 0 && user.score != ranking[ranking.length-1].score) rank++;
        userRank = rank;
        ranking.push({
            rank: rank,
            name: user.name,
            score: user.score,
            level: user.level
        });
    }

    return [ranking,userRank];
}