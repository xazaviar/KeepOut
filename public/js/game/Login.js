var backColor = {r:0,b:0,g:0}, colorGoal = {r:0,b:0,g:0};

$(document).ready(function() {
	backColor = {r:parseInt(Math.random()*255),g:parseInt(Math.random()*255),b:parseInt(Math.random()*255)};
    colorGoal = {r:parseInt(Math.random()*255),g:parseInt(Math.random()*255),b:parseInt(Math.random()*255)};
	setInterval(drawBackground,20);
});


//background coloring
function drawBackground(){
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
}