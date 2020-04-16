const PORT = process.env.PORT || 8080;
const FPS = 20; // was 60, using reduced to increase performance
const DEV_MODE = true;

//Dependencies
const fs = require('fs');
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const Game = require('./lib/Game');
const { createLogger, format, transports } = require('winston');
const { combine, timestamp, label, printf } = format;
 
const logFormat = printf(({ level, message, timestamp }) => {
  return `${timestamp} ${level}: ${message}`;
});
const consoleFormat = printf(({ level, message}) => {
  return `${level}: ${message}`;
});

//Logs
const logger = createLogger({
    level: 'info',
    format: combine(
        timestamp(),
        logFormat
    ),
    defaultMeta: { service: 'user-service' },
    transports: [
        new transports.File({ filename: 'logs/error.log', level: 'error' }),
        new transports.File({ filename: 'logs/combined.log' })
    ]
    // ,
    // exceptionHandlers: [
    //     new transports.File({ filename: 'logs/exceptions.log' })
    // ],
    // exitOnError: false
});

if (DEV_MODE) {
    logger.add(new transports.Console({
      format: consoleFormat
    }));
}else{
  logger.emitErrs = false;
}

// Initialization.
var app = express();
var server = http.Server(app);
var io = socketIO(server);
var game = Game.create(DEV_MODE, logger);

app.set('trust proxy', true);
app.set('port', PORT);
app.use('/public', express.static(__dirname + '/public'));

app.get('/signin', function(req, res){
    res.sendFile( __dirname + "/public/signin.html" );
});

app.get('/game', function(req, res){
    res.sendFile( __dirname + "/public/index.html" );
});

app.get('/', function(req, res){
    res.sendFile( __dirname + "/public/home.html" );
});

app.get('/*', function (req, res, next) {
    var file = req.params[0];

    fs.readFile(__dirname + '/public/' + file, 'utf-8', function (err, data) {
        var ip = req.header('x-forwarded-for') || req.connection.remoteAddress;

        if(err){
            logger.error("No such file or directory '"+err.path+"' [REQUEST FROM: "+ip+"]");
            res.sendFile( __dirname + "/public/404.html" );
        }else{
            res.sendFile( __dirname + '/public/' + file);
        }
    });
});

/**
 * Server side input handler, modifies the state of the players and the
 * game based on the input it receives. Everything here runs asynchronously.
 */
io.on('connection', (socket) => {
	socket.on('player-connect', (data) => {
		//Correct name length
    data.name = data.name.split(" ").join("_");
		if(data.name.length > 10) data.name = data.name.substring(0,10);
    if(data.name.length < 3) data.name = "???";
		
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
    logger.info("***********************************");
  	logger.info(`STARTING SERVER ON PORT ${PORT}`);
    logger.info("***********************************");
});