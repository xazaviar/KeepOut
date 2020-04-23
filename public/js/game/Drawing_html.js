var table = null, first = true;
var recentList = null;

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
    this.curView = null;
    this.prevView = null;
    this.prevBallCount = 0;
    this.quickStats = false;
    this.targetSort = "SCORE";
    this.targetViewPage = 0;
    this.targetViewPageCount = 10;

    //Ball Target
    this.ballTarget = null;
    this.permTarget = null;
    this.targetName = "RANDOM";
    this.storePurchase = null;

    this.moneySign = "〶"; //https://coolsymbol.com/

    //Tick
    this.ticks = 0;

    //Target View Refresh Timer
    var context = this;
    setInterval(function(){if(table!=null) updateTargetTable(context)},500)

    //Menu Clicking
    $(".menuItem").on("click", function(){
        if(context.curView != this.id) 
            //Check for quickStats
            if(this.id == "quickStats"){
                context.quickStats = !context.quickStats;
                if(context.quickStats) $(".menuItem#quickStats img").attr("src", context.quickStats_onImg.src);
                else $(".menuItem#quickStats img").attr("src", context.quickStats_offImg.src);
                context.curView = null;
            } 
            else context.curView = this.id;
        else context.curView = null;

    });


    //Mobile Swipe Commands [PHONE MIGHT NOT ACCEPT SWIPE EVENTS]
    $(".overlay").on("swipe", function(){
        // console.log("HIT");
        $(".title p").text("DOWN");
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

    $('.ballClick#'+ball.auth).on("tap", function(){
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
    recentList = list;

    //display overlay
    $(".overlay").toggle(this.curView!=null)
    $(".title").toggle(this.curView==null)
    if(this.curView!=null){
        $('.menuBar').css("height","50px");
        $(".quickStats").toggle(false);
    } 
    else{
        $('.menuBar').css("height","");
        $(".quickStats").toggle(this.quickStats);
        if(this.quickStats) this.updateQuickStats(user, list);
    } 

    //Update the current view 
    if(this.curView == "leaderboard") this.drawLeaderboard(user, list);
    else if(this.curView == "stats") this.drawStats(user, list);
    else if(this.curView == "target") this.drawTarget(user, list);
    else if(this.curView == "history") this.drawHistory(user);
    else if(this.curView == "settings") this.drawSettings(user);
}

Drawing_html.prototype.drawLeaderboard = function(user, list){
    $(".view").empty();
    this.prevView = "leaderboard";
    table = null;

    //Sort list
    var temp = rankPlayers(user, list);
    var rankings = temp[0];
    var userRank = temp[1];

    $(".view").append("<table id='leaderboard'><thead><tr><th>RANK</th><th>NAME</th><th>SCORE</th></tr></thead><tbody></tbody></table>");

    var inserted = false;
    for(var r = 0; r < Math.min(10,rankings.length); r++){
        if(rankings[r].name == user.name && rankings[r].score == user.score){
            inserted = true;
            $(".view table#leaderboard tbody").append("<tr class='user'><td>"+rankings[r].rank+"</td><td>"+rankings[r].name+"</td><td>"+formatScore(rankings[r].score)+"</td></tr>");
        } 
        else $(".view table#leaderboard tbody").append("<tr><td>"+rankings[r].rank+"</td><td>"+rankings[r].name+"</td><td>"+formatScore(rankings[r].score)+"</td></tr>");
    }

    //User is either bottom of list or not top ten
    if(!inserted){
        var bRank = Math.min(10,list.length)+1;
        var extra = bRank>10?40:0;

        //dots
        if(extra) $(".view table#leaderboard tbody").append("<tr><td></td><td>...</td><td></td></tr>");
    
        //User
        $(".view table#leaderboard tbody").append("<tr class='user'><td>"+userRank+"</td><td>"+user.name+"</td><td>"+formatScore(user.score)+"</td></tr>");
    }
}

Drawing_html.prototype.drawStats = function(user, list){
    $(".view").empty();
    this.prevView = "stats";
    table = null;

    var userRank = rankPlayers(user,list)[1];
    
    $(".view").append("<div class='statsBox'></div>");

    $(".view .statsBox").append("<p id='name'>"+user.name+"</p>");
    $(".view .statsBox").append("<p id='rank'>"+userRank+"/"+(list.length+1)+"<br>SCORE: "+formatScore(user.score)+"</p>");

    $(".view .statsBox").append("<p id='level'>"+user.level+"</p>");

    var expPercent = (user.experience-user.expPrev)/(user.nextLevel-user.expPrev)*100;
    $(".view .statsBox").append("<div id='levelBar'><div id='levelPercent' style='width:"+expPercent+"%'> </div></div>");


    $(".view .statsBox").append("<p id='stats'>"+
            "Lifetime: "+convertSeconds(user.lifetime)+" (live "+(user.activetime/user.lifetime*100).toFixed(0)+"%)<br>"+
            "Total Balls: "+user.ballCount+"<br><span></span>"+
                (user.ballCount-user.moneyBallCount-user.targetBallCount)+" <span class='NORMAL' style='background-color:transparent'>⦿</span> "+
                user.moneyBallCount+" <span class='MONEY'style='background-color:transparent'>⦿</span> "+
                user.targetBallCount+" <span class='TARGET' style='background-color:transparent'>⦿</span><br>"+
            "Balltime: "+convertSeconds(user.balltime)+" ("+(user.balltime/user.lifetime*100).toFixed(1)+"%)</br>"+
            "Balltime [S]: "+convertSeconds(user.balltimeS)+"</br>"+
            "Total Swats: "+user.swatCount+" ("+(user.ballCount==0?0:user.swatCount/user.ballCount*100).toFixed(1)+"%)"+"</br>"+
            "Balls Sent: "+user.targetBallsSent+"</br>"+
            "High Score: "+formatScore(user.highScore)+"</br>"+
            "Low Score: "+formatScore(user.lowScore)+"</br>"+
            user.money+this.moneySign+" / "+user.moneyTotal+this.moneySign+"</br>"+
        "</p>");
}

Drawing_html.prototype.drawTarget = function(user, list){
    this.prevView = "target";

    //Initial view creation
    if(table==null){
        $(".view").empty();

        //Information
        $(".view").append("<div class='tableBox'><p id='info'> TARGETING: "+this.targetName+"<br>"+
                          "ARSENAL: "+user.targetBalls+"<br>"+
                          "MONEY: "+user.money+this.moneySign+"</p></div>");


        //Table
        $(".view .tableBox").append("<table id='target'><thead><tr><th id='NAME'>NAME</th><th id='SCORE'>SCORE</th><th id='BALLS'>#</th><th id='actions'>ACTIONS</th></tr></thead><tbody></tbody></table>");
        
        //Doctor the data
        var result = [];
        for(var i = 0; i < list.length; i++){
            var temp = [], d = 0;
            temp[d] = "<tag "+(!list[i].isActive?"class='inactive'":"")+">"+list[i].name+"</tag>"; d++;
            temp[d] = formatScore(list[i].score); d++;
            temp[d] = list[i].ballCount; d++;
            temp[d] = "<img class='targeting' id='"+list[i].id+"' src='"+this.targetImg.src+"'/><img class='send' id='"+list[i].id+"' src='"+this.sendImg.src+"'/>"; d++;
            result.push(temp);  
        }
        table = $('#target').DataTable({
            "data": result,
            "iDisplayLength": -1,
            "bLengthChange": false,
            "pageLength": 10,
            "searching": true,
            "aaSorting": [0,"asc"]
        });

        var context = this;
        $(".targeting").on("click", function(){
            if(context.permTarget==this.id) context.permTarget = null;
            else context.permTarget = this.id;
        });

        $(".send").on("click", function(){
            context.ballTarget = this.id;
        });

        //Update Defaults
        $(".dataTables_filter").append("<p id='searchText'>SEARCH:</p>");
    }

    $("a.previous.paginate_button").text("<");
    $("a.next.paginate_button").text(">");


    //Update Data
    $(".view p#info").html("TARGETING: "+this.targetName+"<br>"+
                          "ARSENAL: "+user.targetBalls+"<br>"+
                          "MONEY: "+user.money+this.moneySign);
}

Drawing_html.prototype.drawHistory = function(user){
    if(this.prevView!="history" || this.ballList.length!=this.prevBallCount){
        this.prevView = "history";
        this.prevBallCount = this.ballList.length;
        $(".view").empty();
        table = null;

        $(".view").append("<div id='history'><table id='history'><thead><tr>"+
                            "<th id='TYPE'>⦿</th>"+
                            "<th id='SEND'>SENDER</th>"+
                            "<th id='REC'>IN</th>"+
                            "<th id='DUR'><img src='"+this.clockImg.src+"'/></th>"+
                            "<th id='SWAT'>SWAT</th>"+
                        "</tr></thead><tbody></tbody></table></div>");

        var history = user.ballHistory.sort(function(a,b){
            if(a.id > b.id) return -1;
            if(a.id < b.id) return 1;
            else return 0;
        });

        for(var h in history){
            $(".view table#history tbody").append("<tr><td style='background-color:transparent' class='"+history[h].type+"'>⦿</td>"+
                                                    "<td>"+history[h].sender.name+"</td>"+
                                                    "<td style='font-size:9pt'>"+dateFormat(history[h].received)+"</td>"+
                                                    "<td>"+(history[h].removed?convertSeconds((history[h].removed-history[h].received)/1000):"LIVE")+"</td>"+
                                                    "<td>"+(history[h].removed?(history[h].autoSwat?"X":"✓"):"")+"</td>"+
                                                "</tr>");
        }
    }
}


Drawing_html.prototype.drawSettings = function(user){}

Drawing_html.prototype.updateQuickStats = function(user,list){
    var userRank = rankPlayers(user,list)[1];
    var newText = "RANK: "+userRank+"<br>SCORE: "+formatScore(user.score)+"<br>"+user.money+this.moneySign;
    if($(".quickStats").html()!=newText)
        $(".quickStats").html(newText);
}


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
    const menu = ["stats", "leaderboard", "quickStats", "target", "history", "settings"];
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
    this.leaderboardImg         = new Image;
    this.leaderboardImg.src     = "/images/leaderboard.png";
    this.statsImg               = new Image;
    this.statsImg.src           = "/images/stats.png";
    this.settingsImg            = new Image;
    this.settingsImg.src        = "/images/settings.png";
    this.quickStats_onImg       = new Image;
    this.quickStats_onImg.src   = "/images/vision_on.png";
    this.quickStats_offImg      = new Image;
    this.quickStats_offImg.src  = "/images/vision_off.png";
    this.targetImg              = new Image;
    this.targetImg.src          = "/images/target.png";
    // this.storeImg               = new Image;
    // this.storeImg.src           = "/images/store.png";
    this.historyImg             = new Image;
    this.historyImg.src         = "/images/history.png";

    //Menuing
    // this.arrowUpImg             = new Image;
    // this.arrowUpImg.src         = "/images/arrow_up.png";
    // this.arrowDownImg           = new Image;
    // this.arrowDownImg.src       = "/images/arrow_down.png";
    // this.shieldImg              = new Image;
    // this.shieldImg.src          = "/images/shield.png";
    this.sendImg                = new Image;
    this.sendImg.src            = "/images/send.png";
    this.clockImg               = new Image;
    this.clockImg.src           = "/images/clock.png";

    //Store Items
    // this.shieldTimeImg          = new Image;
    // this.shieldTimeImg.src      = "/images/shield_time.png";
    // this.shieldHitImg           = new Image;
    // this.shieldHitImg.src       = "/images/shield_hits.png";
    // this.x2Img                  = new Image;
    // this.x2Img.src              = "/images/x2.png";
    // this.x3Img                  = new Image;
    // this.x3Img.src              = "/images/x3.png";
    // this.x4Img                  = new Image;
    // this.x4Img.src              = "/images/x4.png";
}

function convertSeconds(sec){
    if(sec == NaN)
        return "error";

    if(sec < 60) //One minute
        return ""+sec.toFixed(0)+"s";
    else if(sec < 60*60) //one hour
        return ""+(Math.floor(sec/60)).toFixed(0)+"m";
    else if(sec < 60*60*24) //one day
        return ""+(sec/(60*60)).toFixed(1)+"h";
    else //More than 1 day
        return ""+(sec/(60*60*24)).toFixed(2)+"d";
}

function dateFormat(milliseconds){
    var date = new Date(milliseconds).toLocaleString();

    return date;
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

function formatScore(score){
    var text = "";

    if(score >99999 || score < -99999){
        text = ""+(score/1000).toFixed(2)+"K";
    }
    else{
        text = ""+(score).toFixed(0);
    }

    return text;
}

function updateTargetTable(context,list){
    var list = recentList;
    var result = [];
    for(var i = 0; i < list.length; i++){
        var temp = [], d = 0;
        temp[d] = "<tag "+(!list[i].isActive?"class='inactive'":"")+">"+list[i].name+"</tag>"; d++;
        temp[d] = formatScore(list[i].score); d++;
        temp[d] = list[i].ballCount; d++;
        temp[d] = "<img class='targeting' id='"+list[i].id+"' src='"+context.targetImg.src+"'/><img class='send' id='"+list[i].id+"' src='"+context.sendImg.src+"'/>"; d++; 
        try{ 
            table.row(i).data(temp);
        }
        catch (err){
            table.row.add(temp);
        }
    }
    // table.draw(); //Not needed, but will auto sort rows

    $(".targeting").on("click", function(){
        if(context.permTarget==this.id) context.permTarget = null;
        else context.permTarget = this.id;

        if(context.permTarget!=null)
            for(var i in list){
                if(list[i].id==context.permTarget){
                    context.targetName = list[i].name;
                    break;
                }
            }
        else context.targetName = "RANDOM";
    });

    $(".send").on("click", function(){
        context.ballTarget = this.id;
    });
}