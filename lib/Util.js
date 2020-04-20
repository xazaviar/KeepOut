const chars = ['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z',
			   'A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z',
			   '0','1','2','3','4','5','6','7','8','9'];

/**
 * Empty constructor for the Util class, all functions will be static.
 */
function Util() {
    throw new Error('Util should not be instantiated!');
}


Util.generateToken = function(n){
	const chars = ['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z',
				   'A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z',
				   '0','1','2','3','4','5','6','7','8','9'];
	var token = '';
	for(var i = 0; i < n; i++){
		token += chars[parseInt(Math.random()*chars.length)];
	}
	return token;
}

module.exports = Util;