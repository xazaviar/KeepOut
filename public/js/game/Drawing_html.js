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
    this.menu = null;

    //Flags
    this.curView = null;
    this.prevView = null;
    this.prevBallCount = 0;
    this.targetSortType = "NAME";
    this.targetSortASC = true;
    this.madeInput = false;
    this.prevMenu = [];
    this.showingLevelup = false;
    this.showingRoundEnd = false;
    this.nameChange = null;
    this.roundHistory = 0;

    //Ball Target
    this.ballTarget = null;
    // this.permTarget = null;
    // this.targetName = "RANDOM";
    this.storePurchase = null;
    this.gameSender = "";

    this.moneySign = "〶"; //https://coolsymbol.com/

    //Tick
    this.ticks = 0;

    //Menu Clicking
    var context = this;
    $(".menuItem").on("click", function(){
        if(context.curView != this.id) context.curView = this.id;
        else context.curView = null;
        context.madeInput = true;
    });


    //Mobile Swipe Commands [PHONE MIGHT NOT ACCEPT SWIPE EVENTS]
    $(".overlay").on("swipe", function(){
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
    $("body").append('<div class="ballClick noselect" id="'+ball.auth+'"><div class="ball noselect '+ball.type+'"></div></div>');
    $('.ballClick#'+ball.auth).css({"left":ball.x,"top":ball.y});

    //Clicking a ball
    $('.ballClick#'+ball.auth).on("click", function(){
        context.clickedBall = this.id;
        context.recentBalls.push(""+context.clickedBall);
        context.drawing.removeBall(context.clickedBall); //Immediate remove
        context.madeInput = true;
    });

    $('.ballClick#'+ball.auth).on("tap", function(){
        context.clickedBall = this.id;
        context.recentBalls.push(""+context.clickedBall);
        context.drawing.removeBall(context.clickedBall); //Immediate remove
        context.madeInput = true;
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

    if(this.staticBGcolor!=null && this.prevMenu.length>0 && this.prevMenu[4].extras.backgroundColor){
        this.backColor = JSON.parse(JSON.stringify(this.staticBGcolor));
        $("body").css("background-color","rgb("+this.staticBGcolor.r+","+this.staticBGcolor.g+","+this.staticBGcolor.b+")");
    } 
    else{
        this.transitionColor();
        $("body").css("background-color","rgb("+this.backColor.r+","+this.backColor.g+","+this.backColor.b+")");
    } 
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

Drawing_html.prototype.drawLevelUp = function(){
    this.showingLevelup = true;
    var context = this;
    $(".title#main").toggle(false);
    $(".overlay").toggle(false);
    $(".menuBar").toggle(false);
    $(".levelUp").toggle(true);
    $(".levelUp").animate({opacity:1.0},2000,function(){
        $(".levelUp").delay(1000).animate({opacity:0.0},2000,function(){
            $(".title#main").toggle(true);
            $(".levelUp").toggle(false);
            $(".overlay").toggle(true);
            $(".menuBar").toggle(true);
            context.showingLevelup = false;
        });
    });
    console.log("SHOWING LEVELUP");
}

Drawing_html.prototype.drawRoundEnd = function(ranking, size){
    console.log(ranking);
    this.showingRoundEnd = true;
    var context = this;
    $(".title#main").toggle(false);
    $(".overlay").toggle(false);
    $(".menuBar").toggle(false);
    $(".roundEnd").toggle(true);

    $(".roundEnd p#message").html(ranking.message);
    $(".roundEnd p#info").html("Round "+(this.gameInfo.roundData.length)+" has ended. "+
                               "You came in <b>"+ranking.rank+rankWord(ranking.rank)+
                               "</b> place out of "+size+" people with a final score of <b>"+
                               formatScore(ranking.score)+"</b>. <br>Good luck in the next round!");

    $(".roundEnd").animate({opacity:1.0},2000,function(){
        $(".roundEnd").delay(4000).animate({opacity:0.0},2000,function(){
            $(".title#main").toggle(true);
            $(".roundEnd").toggle(false);
            $(".overlay").toggle(true);
            $(".menuBar").toggle(true);
            context.showingRoundEnd = false;
        });
    });
    console.log("SHOWING ROUND END");
}

//**************************************************************************
//Menus
//**************************************************************************
Drawing_html.prototype.drawAlternateView = function(user, list){
    recentList = list;

    //display overlay
    // console.log(this.showingLevelup, this.showingRoundEnd);
    if(!this.showingLevelup && !this.showingRoundEnd){
        $(".overlay").toggle(this.curView!=null);
        $(".title#main").toggle(this.curView==null);

        if(this.curView!=null){
            $('.menuBar').css("height","50px");
            $(".quickStats").toggle(false);
        } 
        else{
            $('.menuBar').css("height","");
            $(".quickStats").toggle(this.quickStatsEnabled);
            if(this.quickStatsEnabled) this.updateQuickStats(user, list);
        }
    }else{
        $(".overlay").toggle(false);
        $(".title#main").toggle(false);
        $(".menuBar").toggle(false);
    } 

    //Update the current view 
    if(this.curView == "leaderboard") this.drawLeaderboard(user, list);
    else if(this.curView == "stats") this.drawStats(user, list);
    else if(this.curView == "target") this.drawTarget(user, list);
    else if(this.curView == "history") this.drawHistory(user, list);
    else if(this.curView == "settings") this.drawSettings(user);

    this.prevMenu = user.menu;
}

Drawing_html.prototype.drawLeaderboard = function(user, list){

    if(this.prevView!="leaderboard"){
        $(".view").empty();
        this.prevView = "leaderboard";
        $(".view").append("<p id='roundInfo' class='noselect'></p><table id='leaderboard'><thead><tr><th>RANK</th><th>NAME</th><th>SCORE</th></tr></thead><tbody></tbody></table><p id='status'></p>");
        
        //Display round info
        $(".view p#roundInfo").html("<b class='arrow noselect' id='arrowLeft'>←</b> <tag id='round'>ROUND "+this.gameInfo.round+"</tag> <b class='arrow noselect' id='arrowRight'>→</b><br> <tag id='date'>This round ends in "+roundDateFormat(this.gameInfo.resetDate)+"</tag>");

        var context = this;
        $("#arrowLeft").on("click", function(){
            context.roundHistory++;
            if(context.roundHistory>=context.gameInfo.roundData.length) 
                context.roundHistory = context.gameInfo.roundData.length;
        });
        $("#arrowRight").on("click", function(){
            context.roundHistory--;
            if(context.roundHistory<=0) 
                context.roundHistory = 0;
        });
    }

    //Toggle arrows
    $("#arrowLeft").toggle(!(this.roundHistory>=this.gameInfo.roundData.length));
    $("#arrowRight").toggle(!(this.roundHistory<=0));
    $(".view tbody").empty();
    $(".view p#status").empty();

    if(this.roundHistory==0){
        //Update Info
        $(".view p#roundInfo #round").text("ROUND "+this.gameInfo.round);
        $(".view p#roundInfo #date").text("This round ends in "+roundDateFormat(this.gameInfo.resetDate));

        //Build table
        var temp = rankPlayers(user, list);
        var rankings = temp[0];
        var userRank = temp[1];
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
    else{
        var roundData = this.gameInfo.roundData[this.gameInfo.roundData.length-this.roundHistory];


        //Update info
        $(".view p#roundInfo #round").text("ROUND "+roundData.round);
        $(".view p#roundInfo #date").text("This round ended on "+(new Date(roundData.end).toLocaleDateString()));

        //Build table
        var r = 0, participated = false;
        for(; r < Math.min(10,roundData.rankings.length); r++){
            var name = getNameFromID(roundData.rankings[r].id, list);

            if(name=="N/A") name = roundData.rankings[r].name;

            if(roundData.rankings[r].id == user.id){
                $(".view table#leaderboard tbody").append("<tr class='user'><td>"+roundData.rankings[r].rank+"</td><td>"+user.name+"</td><td>"+formatScore(roundData.rankings[r].score)+"</td></tr>");
                participated = roundData.rankings[r];
            } 
            else $(".view table#leaderboard tbody").append("<tr><td>"+roundData.rankings[r].rank+"</td><td>"+name+"</td><td>"+formatScore(roundData.rankings[r].score)+"</td></tr>");
        }

        //User is either did not participate in the round or did not make top 10
        if(!participated){
            for(; r < roundData.rankings.length; r++){
                if(roundData.rankings[r].id == user.id){
                    participated = roundData.rankings[r];
                    break;
                }
            }
        }

        if(!participated){
            $(".view #status").html("You did not participate in or complete this round.");
        }else{
            $(".view #status").html("You ranked <b>"+participated.rank+rankWord(participated.rank)+"</b> out of "+roundData.rankings.length+" players with a score of <b>"+formatScore(participated.score)+"</b>");
        }
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

    //Initial view creation
    if(this.prevView!="target" || (this.prevMenu[2].extras.advanced == false && user.menu[2].extras.advanced == true)){
        this.prevView = "target";
        table==null
        $(".view").empty();

        //Information
        $(".view").append("<div class='tableBox'><p id='info'></p></div>");

        drawTargetTable(this,list,user.menu[2].extras.advanced);
    }


    if(user.menu[2].extras.advanced) $(".view th#name").css("width","35%");
    else $(".view th#name").css("width","45%");

    //Update Data
    var fill ="TARGETING: "+this.targetName+"<br>"+
              "MONEY: "+user.money+this.moneySign+"<br>"+
              "ARSENAL: "+user.targetBalls+'<button id="purchase">+</button>'+" (100"+this.moneySign+" per)";
    if($(".view p#info").html()!=fill){
        $(".view p#info").html(fill);

        var context = this;
        $("button#purchase").on("click", function(){
            context.storePurchase = "TARGET_BALL";
        });
    } 

    for(var i = 0; i < list.length; i++){
        if(this.permTarget!=null && this.permTarget==list[i].id) this.targetName = list[i].name;
        $("tr#_"+list[i].id+" td#name").html("<tag "+(!list[i].isActive?"class='inactive'":"")+">"+list[i].name+"</tag>");
        $("tr#_"+list[i].id+" td#score").text(formatScore(list[i].score));
        $("tr#_"+list[i].id+" td#balls").text(list[i].ballCount);
    }

    //plus button Coloring
    // var colorDown = 80;
    // $(".tableBox button").css("color","white");
    // if(this.staticBGcolor==null)
    //     $(".tableBox button:hover").css("color","rgb("+Math.max(this.backColor.r-colorDown,0)+","+Math.max(this.backColor.g-colorDown,0)+","+Math.max(this.backColor.b-colorDown,0)+")");
    // else{
    //     $(".tableBox button:hover").css("color","rgb("+Math.max(this.staticBGcolor.r-colorDown,0)+","+Math.max(this.staticBGcolor.g-colorDown,0)+","+Math.max(this.staticBGcolor.b-colorDown,0)+")");
    // }
}

Drawing_html.prototype.drawHistory = function(user, list){
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

        for(var h = 0; h < Math.min(history.length,50); h++){
            var name = "N/A";
            if(history[h].sender.id == -1) name = this.gameSender;
            else for(var l in list){
                if(list[l].id == history[h].sender.id){
                    name = list[l].name;
                    break;
                }
            }


            $(".view table#history tbody").append("<tr><td style='background-color:transparent' class='"+history[h].type+"'>⦿</td>"+
                                                    "<td>"+name+"</td>"+
                                                    "<td style='font-size:9pt'>"+dateFormat(history[h].received)+"</td>"+
                                                    "<td>"+(history[h].removed?convertSeconds((history[h].removed-history[h].received)/1000):"LIVE")+"</td>"+
                                                    "<td>"+(history[h].removed?(history[h].autoSwat?"X":"✓"):"")+"</td>"+
                                                "</tr>");
        }
    }
}

Drawing_html.prototype.drawSettings = function(user){
    //Reference: https://htmlcolorcodes.com/color-chart/
    var colorList = [
        {"name": "Passion Fruit",   "color": {r:211,g:47,b:47}},
        {"name": "Zest",            "color": {r:194,g:24,b:91}},
        {"name": "Royal",           "color": {r:123,g:31,b:162}},
        {"name": "Midnight",        "color": {r:81,g:45,b:168}},
        {"name": "Chill",           "color": {r:48,g:63,b:159}},
        {"name": "Ocean",           "color": {r:2,g:136,b:209}},
        {"name": "Dinosaur",        "color": {r:0,g:121,b:107}},
        {"name": "Jungle",          "color": {r:56,g:142,b:80}},
        {"name": "Sun Rise",        "color": {r:251,g:192,b:45}},
        {"name": "Sun Set",         "color": {r:245,g:124,b:0}},
        {"name": "Summer Heat",     "color": {r:230,g:74,b:25}},
        {"name": "Sophisticated",   "color": {r:93,g:64,b:55}},
        {"name": "Rain",            "color": {r:69,g:90,b:100}},
        {"name": "Blank",           "color": {r:255,g:255,b:255}}
    ]
    
    if(this.prevView!="settings"){
        this.prevView = "settings";
        table=null;
        $(".view").empty();
        var extras = user.menu[4].extras;
        var context = this;

        
        $(".view").append("<div id='settings'></div>");

        //Player Info
        var playerInfo = $("<div id='views'></div>");
        if(extras.nameChange){
            playerInfo.append("<p><b>PLAYER INFO</b></p>");
            playerInfo.append("Name: <input type='text' name='name' value='"+user.name+"' minlength=3 maxlength=12/>");
            playerInfo.append("<button id='nameChange'>✓</button>");
            
        }
        $(".view #settings").append(playerInfo);

        //Views
        var views = $("<div id='views'></div>");
        if(extras.quickStats){
            views.append("<p><b>VIEWS</b></p>");
            views.append("Quick Stats: <input type='checkbox' name='quickStats' "+
                         (this.quickStatsEnabled?"checked":"")+"/>");
            
        }
        $(".view #settings").append(views);

        //Views Event listeners
        $("input[type='checkbox']").on("click", function(){
            context.quickStatsEnabled = $(this).prop("checked");
        });


        //Background
        var background = $("<div id='background'></div>");
        if(extras.backgroundColor){
            background.append("<p><b>BACKGROUND</b></p>");
            background.append("Dynamic: <input type='radio' name='bgcolor' value='dynamic' "+
                             (this.staticBGcolor==null?"checked":"")+"/><br>");
            background.append("Static: <input type='radio' name='bgcolor' value='static'"+
                             (this.staticBGcolor!=null?"checked":"")+"/>");

            var options = "";
            for(var c in colorList){
                var selected = false;
                if(context.staticBGcolor!=null && context.staticBGcolor.r==colorList[c].color.r) selected = true;

                options+="<option value='"+colorList[c].name+"' "+(selected?"selected":"")+">"+colorList[c].name+"</option>";
            }

            background.append("<br><p id='colorInput' style='display:"+(this.staticBGcolor!=null?"block":"none")+
                              "'>Color: <select id='color'>"+options+"</select></p>");
        
        }
        $(".view #settings").append(background);

        //Background Event listeners
        $("input[type='radio']").on("click", function(){
            var value = $("input[name='bgcolor']:checked").val();

            if(value=="dynamic"){
                context.staticBGcolor = null;
                $("#colorInput").toggle(false);
            } 
            else{
                if(context.staticBGcolor == null) context.staticBGcolor = "000";
                else context.staticBGcolor = $("input[name='color']").val();
                $("#colorInput").toggle(true); 
            } 

        });
        $("select#color").on("change", function(){
            for(var c in colorList){
                if(colorList[c].name == $(this).children("option:selected").val()){
                    context.staticBGcolor = colorList[c].color;
                    break;
                }
            }
        });

        //Sign out Button
        $(".view #settings").append('<br><br><button id="signout">LOG OUT</button>');

        $("button#signout").on("click",function(){
            if(confirm("Are you sure you want to log out? You will still be in the game and will have to sign back in manually.")){
                //Remove creds
                localStorage.removeItem("email");
                localStorage.removeItem("password");

                //Redirect
                window.location.assign(window.location.origin);
            }else{}
        });

        $("button#nameChange").on("click",function(){
            var nameVal = $("input[name='name']").val();

            if(confirm("Are you sure you want to change your name to "+nameVal+"?")){
                context.nameChange = nameVal;
            }else{}
        });
    }

    //Signout button Coloring
    var colorDown = 80;
    $("#settings button").css("color","white");
    if(this.staticBGcolor==null)
        $("#settings button:hover").css("color","rgb("+Math.max(this.backColor.r-colorDown,0)+","+Math.max(this.backColor.g-colorDown,0)+","+Math.max(this.backColor.b-colorDown,0)+")");
    else{
        $("#settings button:hover").css("color","rgb("+Math.max(this.staticBGcolor.r-colorDown,0)+","+Math.max(this.staticBGcolor.g-colorDown,0)+","+Math.max(this.staticBGcolor.b-colorDown,0)+")");
    }
}

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
    this.ballSize = Math.min(Math.max(30,this.WIDTH*.08),60);
    var margin = this.ballSize*(this.ballClickScale-1)/2;
    $(".ball").css({"width":this.ballSize+"px","height":this.ballSize+"px","margin":margin+"px 0 0 "+margin+"px"});
    $(".ballClick").css({"width":this.ballSize*this.ballClickScale+"px","height":this.ballSize*this.ballClickScale+"px"});


    //Check menu options
    var count = 0;
    for(var m in menuItems){
        if(menuItems[m].unlocked && $(".menuItem#"+menuItems[m].name).css("display") == "none"){
            count++;
            $(".menuItem#"+menuItems[m].name).toggle(true);
        }else if(menuItems[m].unlocked) count++;
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

function roundDateFormat(targetDate){
    var timeLeft = targetDate - new Date().getTime();

    var days = Math.max(Math.floor(timeLeft / (1000 * 60 * 60 * 24)),0);
    var hours = Math.max(Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),0);
    var minutes = Math.max(Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60)),0);
    var seconds = Math.max(Math.floor((timeLeft % (1000 * 60)) / 1000),0);
    var milliseconds = Math.max(Math.floor((timeLeft % 1000)/10),0);

    // console.log(days, hours, minutes, seconds, milliseconds);

    var ret = "";
    if(days > 2) ret = days+"d "+hours+"h";
    else if(days*24+hours >= 1) ret = (days*24+hours>9?days*24+hours:"0"+(days*24+hours))+":"+(minutes>9?minutes:"0"+minutes)+":"+(seconds>9?seconds:"0"+seconds);
    else if(minutes > 0) ret = (minutes>9?minutes:"0"+minutes)+":"+(seconds>9?seconds:"0"+seconds);
    else ret = "00:"+(seconds>9?seconds:"0"+seconds)+"."+(milliseconds>9?milliseconds:"0"+milliseconds);


    return ret;
    // return new Date(milliseconds).toLocaleString();
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

function drawTargetTable(context, list, advanced){
    //Sort the list
    list.sort(function(a,b){
        if(context.targetSortType=="NAME"){
            if(a.name.toUpperCase()>b.name.toUpperCase()) return context.targetSortASC?1:-1;
            if(a.name.toUpperCase()<b.name.toUpperCase()) return context.targetSortASC?-1:1;
            else return 0;
        }
        else if(context.targetSortType=="SCORE"){
            if(a.score>b.score) return context.targetSortASC?1:-1;
            if(a.score<b.score) return context.targetSortASC?-1:1;
            else return 0;
        }
        else if(context.targetSortType=="BALLS"){
            if(a.ballCount>b.ballCount) return context.targetSortASC?1:-1;
            if(a.ballCount<b.ballCount) return context.targetSortASC?-1:1;
            else return 0;
        }
    });

    //Table
    $(".view .tableBox table").empty();
    $(".view .tableBox").append("<table id='target'><thead><tr><th id='NAME'>NAME</th>"+
                                (advanced?"<th id='SCORE'>SCORE</th>":"")+
                                "<th id='BALLS'>#</th><th id='actions'>ACTIONS</th></tr></thead><tbody></tbody></table>");

    var data = "";
    for(var i = 0; i < list.length; i++){
        data+="<tr id='_"+list[i].id+"'>";
        data+="<td id='name'><tag "+(!list[i].isActive?"class='inactive'":"")+">"+list[i].name+"</tag></td>";
        if(advanced){
            data+="<td id='score'>"+formatScore(list[i].score)+"</td>";
        }
        data+="<td id='balls'>"+list[i].ballCount+"</td>";
        data+="<td id='actions'><img class='targeting' id='"+list[i].id+"' src='"+context.targetImg.src+"'/><img class='send' id='"+list[i].id+"' src='"+context.sendImg.src+"'/></td>";
        data+="</tr>";
    }

    $(".view .tableBox tbody").append(data);

    $(".targeting").on("click", function(){
        if(context.permTarget==this.id) context.permTarget = null;
        else context.permTarget = this.id;

        //Might be able to make O(1)
        if(context.permTarget!=null)
            for(var i in list){
                if(list[i].id==context.permTarget){
                    context.targetName = list[i].name;
                    break;
                }
            }
        else context.targetName = "RANDOM";
        context.madeInput = true;
    });

    $(".send").on("click", function(){
        context.ballTarget = this.id;
    });

    //Sorting Headers
    $("th").on("click", function(){
        if(context.targetSortType == this.id) context.targetSortASC = !context.targetSortASC;
        context.targetSortType = this.id;
        drawTargetTable(context, list, advanced);
    });
}

function hexToRgb(hex) {
    var result = /^#?([a-f\d]{1,2})([a-f\d]{1,2})([a-f\d]{1,2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function getNameFromID(id, list){
    for(var l in list){
        if(list[l].id == id) return list[l].name;
    }
    return "N/A";
}

function rankWord(rank){
    if(rank%10==1 && rank!=11) return "st";
    if(rank%10==2 && rank!=12) return "nd";
    if(rank%10==3 && rank!=13) return "rd";
    else return "th";
}