var HEIGHT = window.innerHeight, WIDTH = window.innerWidth;
var ballSize = 0, ballClickScale = 1.6;
var backColor = {r:parseInt(Math.random()*255),g:parseInt(Math.random()*255),b:parseInt(Math.random()*255)}, 
    colorGoal = {r:parseInt(Math.random()*255),g:parseInt(Math.random()*255),b:parseInt(Math.random()*255)};
var balls = [];

$(document).ready(function() {
	//Create background balls
    for(var b = 0; b < 4; b++){
        var ball = new Ball("sender", "ball_id_"+b, "NORMAL", WIDTH, HEIGHT);
        balls.push(ball);
        $("body").append('<div class="ballClick" id="'+ball.auth+'"><div class="ball '+ball.type+'"></div></div>');
        $('.ballClick#'+ball.auth).css({"left":ball.x,"top":ball.y});
    }
    drawBackground();
    setInterval(drawBackground,20);
});


function drawBackground(){
    resize();

	//background coloring
    const inc = .5;

    if( backColor.r == colorGoal.r && 
        backColor.g == colorGoal.g && 
        backColor.b == colorGoal.b){
        colorGoal = {r:parseInt(Math.random()*255),g:parseInt(Math.random()*255),b:parseInt(Math.random()*255)};
    }

    if(colorGoal.r > backColor.r) backColor.r+=inc;
    else if(colorGoal.r < backColor.r) backColor.r-=inc;

    if(colorGoal.g > backColor.g) backColor.g+=inc;
    else if(colorGoal.g < backColor.g) backColor.g-=inc;

    if(colorGoal.b > backColor.b) backColor.b+=inc;
    else if(colorGoal.b < backColor.b) backColor.b-=inc;

    $("body").css("background-color","rgb("+backColor.r+","+backColor.g+","+backColor.b+")");
    $("button").css("color","white");
    $("button:hover").css("color","rgb("+backColor.r+","+backColor.g+","+backColor.b+")");

    //Background balls
    var margin = ballSize*(ballClickScale-1)/2;
    for(var b in balls){
        //Move balls
        balls[b].move();
        balls[b].bounce2(WIDTH, HEIGHT, ballSize, margin);

        //Update ball
        $('.ballClick#'+balls[b].auth).css({"left":balls[b].x,"top":balls[b].y});
    }
}

function resize(){
    WIDTH = window.innerWidth;
    HEIGHT = window.innerHeight;

    //Resize balls
    ballSize = Math.min(Math.max(25,WIDTH*.05),60);
    var margin = ballSize*(ballClickScale-1)/2;
    $(".ball").css({"width":ballSize+"px","height":ballSize+"px","margin":margin+"px 0 0 "+margin+"px"});
    $(".ballClick").css({"width":ballSize*ballClickScale+"px","height":ballSize*ballClickScale+"px"});
}