$(document).ready(function() {
    //Check for login credentials
    if(typeof(localStorage.email) == "undefined" || typeof(localStorage.password) == "undefined"){
        console.log(window.location);
        window.location.assign(window.location.origin);         
    }
    else{
        var socket = io();
      	var canvas = document.getElementById('canvas');

      	var game = Game.create(socket, canvas);

      	game.init(localStorage.email, localStorage.password);
        game.animate();
    }

    //Is this needed?
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