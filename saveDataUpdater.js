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
		// playerData[p]["showRoundEnd"] = false; 
		if(playerData[p].id == "iLGUGmVUbzCaNBaxYI80"){
			playerData[p].password = "sha1$1f45b6b3$1$d471429a56007cd1d256f46f2acdf42802ff8f2c";
			playerData[p].targetBalls+=25;
		}else if(playerData[p].id == HS9tL5jMYbBTX2ROQzpN)
			playerData[p].targetBalls+=200;
		else
			playerData[p].targetBalls+=20;
	
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
    fs.writeFile(saveFile, JSON.stringify(playerData, null, 4), function(err){
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