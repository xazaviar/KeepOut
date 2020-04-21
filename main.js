require('dotenv').config();
const PORT = parseInt(process.env.PORT) || 8080;
const FPS = parseInt(process.env.FPS) || 20; // was 60, using reduced to increase performance

//Dependencies
const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');
const http = require('http');
const socketIO = require('socket.io');
const Game = require('./lib/Game');
const Util = require('./lib/Util');
const passHash = require('password-hash');
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
});

if (process.env.ISPROD==false) {
    logger.add(new transports.Console({
      format: consoleFormat
    }));
}else{
    logger.emitErrs = false;
}

// Initialization
var app = express();
var server = http.Server(app);
var io = socketIO(server);
var game = Game.create(process.env.ISPROD==false, logger);

var newPlayerQueue = [];

app.set('trust proxy', true);
app.set('port', PORT);
app.use(bodyParser.json());
app.use('/public', express.static(__dirname + '/public'));

//***************************************************
//PAGES
//***************************************************
// app.get('/signin', function(req, res){
//     res.sendFile( __dirname + "/public/signin.html" );
// });

app.get('/game', function(req, res){
    res.sendFile( __dirname + "/public/game.html" );
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

//***************************************************
//REQUESTS
//***************************************************
app.post('/createNewUser', function(req, res){
    if(typeof req.body.name != "undefined" && typeof req.body.email != "undefined" && typeof req.body.password != "undefined"){
        var name = req.body.name;
        var email = req.body.email;
        var password = req.body.password;


        //Name validation/Corrections
        name = name.trim(); //Remove surrounding whitespace
        name = name.split(" ").join("_"); //Turn inner whitespace into underlines
        if(name.length > 12) name = name.substring(0,12); //Shorten name
        if(name.length < 3) name = "user_"+Util.generateToken(6); //Give random name for too short name
        password = password.trim();


        var inQueue = false;
        for(var q in newPlayerQueue){
            if(name == newPlayerQueue[q].name && email == newPlayerQueue[q].email){
                inQueue = true;
                break;
            }
        }

        //Email validation
        if(email.indexOf(".") == -1 || email.indexOf("@") == -1){
            res.status(406).send("invalid email address");
        }
        else if(!game.uniqueEmail(email) || inQueue){
            res.status(406).send("email address already in use");
        }
        //Password Validation
        else if(password.length < 6){
            res.status(406).send("password too short");
        }
        else{
            //Everything is valid, create the account
            newPlayerQueue.push({
                "name": name,
                "email": email,
                "password": passHash.generate(password) //Server Encrypt
            });

            res.status(201).send({
                "name": name,
                "email": email,
                "password": password //Client Encrypt?
            });
        }
    }else res.status(400).send("missing input");
});

app.post('/signIn', function(req, res){
    if(typeof req.body.password != "undefined" && typeof req.body.email != "undefined"){
        var email = req.body.email;
        var password = req.body.password;


        if(email.indexOf(".") == -1 || email.indexOf("@") == -1){
            res.status(406).send("invalid email address");
        }
        //Password Validation
        else if(password.length < 6){
            res.status(406).send("password too short");
        }
        else{
            //error 401
            var found = false;
            var players = game.getPlayers();
            for(var p in players){
                var creds = players[p].getLoginCreds();
                if(email == creds[0] && passHash.verify(password, creds[1])){
                    res.status(201).send({
                        "email": email,
                        "password": password
                    });
                    found = true;
                    break;
                }
            }
            if(!found) res.status(401).send("email and password combination not found");
            
        }
    }else res.status(400).send("missing input");
});


/**
 * Server side input handler, modifies the state of the players and the
 * game based on the input it receives. Everything here runs asynchronously.
 */
io.on('connection', (socket) => {
    socket.on('player-connect', (data) => {
        var inQueue = false;
        for(var q in newPlayerQueue){
            if(data.email == newPlayerQueue[q].email){ //Should I check name? data.name == newPlayerQueue[q].name && 
                //validate password
                if(passHash.verify(data.password, newPlayerQueue[q].password)){
                    inQueue = true;
                    game.addNewPlayer(socket, newPlayerQueue[q].name,newPlayerQueue[q].email,newPlayerQueue[q].password);
                    newPlayerQueue.splice(q, 1);
                    break;
                }
            }
        }

        if(!inQueue)
            game.reconnectPlayer(socket, data.email, data.password);	
        
    });

    socket.on('player-action', (data) => {
        game.updatePlayerOnInput(socket.id, data);
    });

    socket.on('disconnect', () => {
        game.disconnectPlayer(socket.id);
    });
});

/**
 * Server side game loop. This runs at 20 frames per second.
 */
setInterval(() => {
    game.update();
    game.sendState();
}, 1000 / FPS);

/**
 * Server side game update loop. This runs once per second.
 */
setInterval(() => {
    game.constUpdate();
}, 1000);

/**
 * Game save loop. This runs once every 5 minutes
 */
setInterval(() => {
    game.saveData();
}, 1000*60*5);

/**
 * Start the server.
 */
server.listen(PORT, function() {
    logger.info("***********************************");
    logger.info(`STARTING SERVER ON PORT ${PORT}`);
    logger.info(Date());
    if(process.env.ISPROD==false) logger.info("DEVELOPER MODE ENABLED");
    logger.info("***********************************");
});



/**
 * Code to run code right before the program closes
 */
process.stdin.resume();

function exitHandler(options, exitCode){
    if (options.cleanup){
        console.log("CLEAN UP?");
    }
    // if (options.error){
    //     logger.error(options.error);
    // }
    // if (exitCode || exitCode === 0) console.log(exitCode);
    if (options.exit){
        logger.info("SERVER PREPARING TO SHUT DOWN");
        game.saveData(function(){
            logger.info("SERVER SHUTTING DOWN");
            process.exit();
        });
    } 
}

//do something when app is closing
process.on('exit', exitHandler.bind(null,{cleanup:true}));

//catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, {exit:true}));

// catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR1', exitHandler.bind(null, {exit:true}));
process.on('SIGUSR2', exitHandler.bind(null, {exit:true}));

//catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, {exit:false,error:true}));