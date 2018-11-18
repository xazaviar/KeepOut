$(document).ready(function() {
    //Check for previous sign in
    var auth = getCookie("auth");
    var name = "???";

    if(auth == ""){
        // New sign in
        // name = prompt("Please enter your name:");
        // if (name == null || name == "") {
        //     name = "???";
        // }
    }

    var socket = io();
  	var canvas = document.getElementById('canvas');
  	// Input.applyEventHandlers();
  	// Input.addMouseTracker(canvas);
    // Input.addTouchTracker(canvas);

  	var game = Game.create(socket, canvas);

  	game.init(name, auth);
    game.animate();

  	$('#canvas').bind('contextmenu', function(e){
        return false;
	}); 
});

function getCookie(cname) {
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for(var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}