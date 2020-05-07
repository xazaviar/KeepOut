//Dependencies
require('dotenv').config();
const fs = require('fs');
const saveFile = process.env.SAVE_FILE;


//Perform changes
loadData(function(playerData){
	makeChanges(playerData);
	saveData(playerData);
});


//Update as needed when data needs to be changed for the game to function
function makeChanges(playerData){
	for(var p in playerData){
		playerData[p]["showRoundEnd"] = false; 
	}
    console.log("Player data updated");
}




function loadData(callback){
    fs.readFile(saveFile, function(err, data){
        if(err){
            console.log("---FAILED TO LOAD DATA---");
            console.log(err);
            process.exit(1);
        } 
        else{
            console.log("Player data loaded");
            callback(JSON.parse(data));
        } 
    });
}

function saveData(playerData){
    fs.writeFile(saveFile, JSON.stringify(playerData), function(err){
        if(err){
            console.log("---FAILED TO SAVE DATA---");
        	console.log(err);
        } 
        else{
            console.log("Player data saved");
            process.exit(0);
        } 
    });
}