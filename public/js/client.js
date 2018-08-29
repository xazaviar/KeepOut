$(document).ready(function() {
    var name = prompt("Please enter your name:");
    if (name == null || name == "") {
        name = "ANONYMOUS";
    }

    var socket = io();
  	var canvas = document.getElementById('canvas');
  	Input.applyEventHandlers();
  	Input.addMouseTracker(canvas);

  	var game = Game.create(socket, canvas);

  	game.init(name);
    game.animate();

  	$('#canvas').bind('contextmenu', function(e){
        return false;
	}); 
});