function Drawing_html() {
    this.loadImages();

    this.WIDTH = window.innerWidth;
    this.HEIGHT = window.innerHeight;
    this.ballClickScale = 1.6;

    this.backColor = {r:parseInt(Math.random()*255),g:parseInt(Math.random()*255),b:parseInt(Math.random()*255)};
    this.colorGoal = {r:parseInt(Math.random()*255),g:parseInt(Math.random()*255),b:parseInt(Math.random()*255)};

    this.ballList = [];
    this.ballsClicked = 0;

    //Flags
    this.curView = "leaderboard";

    //Ball Target
    this.ballTarget = null;
    this.storePurchase = null;

    this.moneySign = "ϡ"; //https://coolsymbol.com/

    //Tick
    this.ticks = 0;

    //Menu Clicking
    var context = this;
    $(".menuItem").on("click", function(){
        if(context.curView != this.id) context.curView = this.id;
        else context.curView = null;
    });
}

Drawing_html.create = function() {
    return new Drawing_html();
}

//**************************************************************************
//Balls
//**************************************************************************
Drawing_html.prototype.newBall = function(sender, auth,  type, context){
    var ball = new Ball(sender, auth, type, this.WIDTH, this.HEIGHT);
    this.ballList.push(ball);
    $("body").append('<div class="ballClick" id="'+ball.auth+'"><div class="ball '+ball.type+'"></div></div>');
    $('.ballClick#'+ball.auth).css({"left":ball.x,"top":ball.y});

    //Clicking a ball
    $('.ballClick#'+ball.auth).on("click", function(){
        context.clickedBall = this.id;
        context.recentBalls.push(""+context.clickedBall);
        context.drawing.removeBall(context.clickedBall); //Immediate remove
    });
}

Drawing_html.prototype.removeBall = function(auth){
    for(var b in this.ballList){
        if(this.ballList[b].auth == auth){
            $('.ballClick#'+this.ballList[b].auth).remove();
            this.ballList.splice(b,1);
            this.ballsClicked++;
            break;
        }
    }
}

//**************************************************************************
//Drawing
//**************************************************************************
Drawing_html.prototype.drawBackground = function(){
    this.transitionColor();
    $("body").css("background-color","rgb("+this.backColor.r+","+this.backColor.g+","+this.backColor.b+")");
}

Drawing_html.prototype.drawBalls = function(){
    var margin = this.ballSize*(this.ballClickScale-1)/2;
    for(var b in this.ballList){
        //Move balls
        this.ballList[b].move();
        this.ballList[b].bounce2(this.WIDTH, this.HEIGHT,this.ballSize, margin);

        //Update ball
        $('.ballClick#'+this.ballList[b].auth).css({"left":this.ballList[b].x,"top":this.ballList[b].y});
    }
}

//**************************************************************************
//Menus
//**************************************************************************
Drawing_html.prototype.drawAlternateView = function(user, list){
    //display overlay
    $(".overlay").toggle(this.curView!=null)
    $(".title").toggle(this.curView==null)
    if(this.curView!=null) $('.menuBar').css("height","50px");
    else $('.menuBar').css("height","");

    //Update the current view
    $(".view").empty();
    if(this.curView == "leaderboard") this.drawLeaderboard(user, list);
    else if(this.curView == "stats") this.drawStats(user, list);
    else if(this.curView == "target") this.drawTarget(user, list);
    else if(this.curView == "store") this.drawStore(user);
    else if(this.curView == "settings") this.drawSettings(user);
}

Drawing_html.prototype.drawLeaderboard = function(user, list){
    //Sort list
    var temp = rankPlayers(user, list);
    var rankings = temp[0];
    var userRank = temp[1];

    $(".view").append("<table><thead><tr><th>RANK</th><th>NAME</th><th>SCORE</th></tr></thead><tbody></tbody></table>");

    var inserted = false;
    for(var r = 0; r < Math.min(10,rankings.length); r++){
        if(rankings[r].name == user.name && rankings[r].score == user.score){
            inserted = true;
            $(".view table tbody").append("<tr id='user'><td>"+rankings[r].rank+"</td><td>"+rankings[r].name+"</td><td>"+rankings[r].score+"</td></tr>");
        } 
        else $(".view table tbody").append("<tr><td>"+rankings[r].rank+"</td><td>"+rankings[r].name+"</td><td>"+rankings[r].score+"</td></tr>");
    }

    //User is either bottom of list or not top ten
    if(!inserted){
        var bRank = Math.min(10,list.length)+1;
        var extra = bRank>10?40:0;

        //dots
        if(extra) $(".view table tbody").append("<tr><td></td><td>...</td><td></td></tr>");
    
        //User
        $(".view table tbody").append("<tr id='user'><td>"+userRank+"</td><td>"+user.name+"</td><td>"+user.score+"</td></tr>");
    }
}

Drawing_html.prototype.drawStats = function(user, list){
    var userRank = rankPlayers(user,list)[1];
    
    
}



Drawing_html.prototype.drawTarget = function(user, list){}
Drawing_html.prototype.drawStore = function(user){}
Drawing_html.prototype.drawSettings = function(user){}


//**************************************************************************
//Util
//**************************************************************************
Drawing_html.prototype.resize = function(menuItems){
    this.WIDTH = window.innerWidth;
    this.HEIGHT = window.innerHeight;

    //Resize title
    var tSize = ""+Math.min(Math.max(40,this.WIDTH*.10),100)+"pt";
    $(".title").css("font-size",tSize);

    //Resize balls
    this.ballSize = Math.min(Math.max(25,this.WIDTH*.05),60);
    var margin = this.ballSize*(this.ballClickScale-1)/2;
    $(".ball").css({"width":this.ballSize+"px","height":this.ballSize+"px","margin":margin+"px 0 0 "+margin+"px"});
    $(".ballClick").css({"width":this.ballSize*this.ballClickScale+"px","height":this.ballSize*this.ballClickScale+"px"});


    //Check menu options
    const menu = ["leaderboard", "stats", "vision", "target", "store", "settings"];
    var count = 0;
    for(var m in menuItems){
        if(menuItems[m] && $(".menuItem#"+menu[m]).css("display") == "none"){
            count++;
            $(".menuItem#"+menu[m]).toggle(true);
        }else if(menuItems[m]) count++;
    }

    //Adjust widths
    $(".menuItem").css("width",(100/count)+"%");
}

Drawing_html.prototype.transitionColor = function(){
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

Drawing_html.prototype.loadImages = function(){
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
    this.vision_offImg.src  = "/images/vision_off.png";
    this.targetImg          = new Image;
    this.targetImg.src      = "/images/target.png";
    this.storeImg           = new Image;
    this.storeImg.src       = "/images/store.png";

    //Menuing
    this.arrowUpImg         = new Image;
    this.arrowUpImg.src     = "/images/arrow_up.png";
    this.arrowDownImg       = new Image;
    this.arrowDownImg.src   = "/images/arrow_down.png";
    this.shieldImg          = new Image;
    this.shieldImg.src      = "/images/shield.png";

    //Store Items
    this.shieldTimeImg      = new Image;
    this.shieldTimeImg.src  = "/images/shield_time.png";
    this.shieldHitImg       = new Image;
    this.shieldHitImg.src   = "/images/shield_hits.png";
    this.x2Img              = new Image;
    this.x2Img.src          = "/images/x2.png";
    this.x3Img              = new Image;
    this.x3Img.src          = "/images/x3.png";
    this.x4Img              = new Image;
    this.x4Img.src          = "/images/x4.png";
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