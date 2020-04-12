var backColor = {r:0,b:0,g:0}, colorGoal = {r:0,b:0,g:0};

$(document).ready(function() {
	gapi.load('auth2', function(){
		gapi.auth2.init();
	});
	backColor = {r:parseInt(Math.random()*255),g:parseInt(Math.random()*255),b:parseInt(Math.random()*255)};
    colorGoal = {r:parseInt(Math.random()*255),g:parseInt(Math.random()*255),b:parseInt(Math.random()*255)};
	setInterval(drawBackground(),200);
});


function onSignIn(googleUser){
	var profile = googleUser.getBasicProfile();
  	console.log('ID: ' + profile.getId()); // Do not send to your backend! Use an ID token instead.
  	console.log('Name: ' + profile.getName());
  	console.log('Image URL: ' + profile.getImageUrl());
  	console.log('Email: ' + profile.getEmail()); // This is null if the 'email' scope is not present.
}


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