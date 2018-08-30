const PORT = process.env.PORT || 8080;
const FPS = 60;

//Dependencies
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const Game = require('./lib/Game');

// Initialization.
var app = express();
var server = http.Server(app);
var io = socketIO(server);
var game = Game.create();

app.set('port', PORT);
app.use('/public', express.static(__dirname + '/public'));

app.get('/', function(req, res){
    res.sendFile( __dirname + "/public/index.html" );
});


//**************************************************************************
//Files
//**************************************************************************
// app.get('/*', function (req, res, next) {
// 	var file = req.params[0];
//   	res.sendFile( __dirname + '/public/' + file);
// });

/**
 * Server side input handler, modifies the state of the players and the
 * game based on the input it receives. Everything here runs asynchronously.
 */
io.on('connection', (socket) => {
	socket.on('player-connect', (data) => {
		//Correct name length
		if(data.name.length > 10) data.name = data.name.substring(0,10);

		
		if(data.auth != "")
    		game.reconnectPlayer(socket, data.name, data.auth);
		else
    		game.addNewPlayer(socket, data.name);
  	});

  	socket.on('player-action', (data) => {
    	game.updatePlayerOnInput(socket.id, data);
  	});

  	socket.on('disconnect', () => {
    	game.disconnectPlayer(socket.id);
  	});
});

/**
 * Server side game loop. This runs at 60 frames per second.
 */
setInterval(() => {
  	game.update();
  	game.sendState();
}, 1000 / FPS);

setInterval(() => {
  	game.constUpdate();
}, 1000);

/**
 * Start the server.
 */
server.listen(PORT, function() {
  	console.log(`STARTING SERVER ON PORT ${PORT}`);
});