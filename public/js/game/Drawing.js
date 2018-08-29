function Drawing(context) {
    this.context = context;
    this.wid = $("#canvas").width();
    this.hei = $("#canvas").height();
    this.scale = 1;
    this.BOX_SIZE = 500;

    this.backColor = {r:parseInt(Math.random()*255),g:parseInt(Math.random()*255),b:parseInt(Math.random()*255)};
    this.colorGoal = {r:parseInt(Math.random()*255),g:parseInt(Math.random()*255),b:parseInt(Math.random()*255)};

    this.ballID   = 0;
    this.ballList = [];
}

Drawing.create = function(context) {
    return new Drawing(context);
}

Drawing.prototype.newBall = function(){
    this.ballList.push(new Ball(this.ballID++,this.BOX_SIZE,this.BOX_SIZE));
    this.ballID++;
}

Drawing.prototype.removeBall = function(id){
    for(var b in this.ballList){
        if(this.ballList[b].id == id){
            this.ballList.splice(b,1);
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
    this.context.fillText("KEEP OUT",40*this.scale,260*this.scale);
    this.context.fill();

    //Instructions
    this.context.beginPath();
    this.context.fillStyle = "#FFF";
    this.context.font = ""+20*this.scale+"px Arial";
    this.context.fillText("Click the ball to keep it out of your box.",70*this.scale,285*this.scale);
    // this.context.fillText("Points are bad, so avoid the ball at all cost.",60*this.scale,300*this.scale);
    this.context.fill();
}

Drawing.prototype.drawPlayerList = function(self,list){
    this.context.beginPath();
    this.context.fillStyle = "#FFF";

    var fontSize = 10;
    this.context.font = "Bold "+(fontSize+3)*this.scale+"px Arial";
    if(self!=null)
        this.context.fillText("["+self.name+"] time: "+self.lifetime+" | ball time: "+self.score,10*this.scale,fontSize*this.scale+5*this.scale);

    this.context.font = ""+fontSize*this.scale+"px Arial";
    for(var l = 0; l < list.length; l++)
        this.context.fillText("["+list[l].name+"] "+list[l].lifetime+" | "+list[l].score+" ("+list[l].balls+")",10*this.scale,(l+2)*fontSize*this.scale+5*this.scale);
    
    this.context.fill();
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