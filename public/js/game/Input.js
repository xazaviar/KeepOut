function Input() {
  throw new Error('Input should not be instantiated!');
}
Input.LAST_INPUT_RECEIVED = new Date();

Input.LEFT_CLICK  	= false;
Input.RIGHT_CLICK 	= false;
Input.MIDDLE_CLICK	= false;

Input.MOUSE       = [0, 0];

Input.MISC_KEYS   = {};

/**
 * This method is a callback bound to the onmousedown event
 * and updates the state of the mouse click stored in the Input class.
 * @param {Event} event The event passed to this function
 */
Input.onMouseDown = function(event) {
  	if (event.which == 1) {
    	Input.LEFT_CLICK = true;
  	} else if (event.which == 2) {
    	Input.MIDDLE_CLICK = true;
  	} else if (event.which == 3) {
    	Input.RIGHT_CLICK = true;
  	}
  	Input.LAST_INPUT_RECEIVED = new Date();
}

/**
 * This method is a callback bound to the onmouseup event on and
 * updates the state of the mouse click stored in the Input class.
 * @param {Event} event The event passed to this function.
 */
Input.onMouseUp = function(event) {
  	if (event.which == 1) {
    	Input.LEFT_CLICK = false;
  	} else if (event.which == 2) {
    	Input.MIDDLE_CLICK = false;
  	} else if (event.which == 3) {
    	Input.RIGHT_CLICK = false;
  	}
  	Input.LAST_INPUT_RECEIVED = new Date();
}

/**
 * This method is a callback bound to the onkeydown event on the document and
 * @param {Event} event The event passed to this function.
 * updates the state of the keys stored in the Input class.
 */
Input.onKeyDown = function(event) {
	switch (event.keyCode) {
		default:
      		Input.MISC_KEYS[event.keyCode] = true;
      		break;
    }
  	Input.LAST_INPUT_RECEIVED = new Date();
}

/**
 * This method is a callback bound to the onkeydown event on the document and
 * @param {Event} event The event passed to this function.
 * updates the state of the keys stored in the Input class.
 */
Input.onKeyUp = function(event) {
	switch (event.keyCode) {
		default:
      		Input.MISC_KEYS[event.keyCode] = false;
      		break;
    }
  	Input.LAST_INPUT_RECEIVED = new Date();
}

/**
 * This should be called during initialization to allow the Input
 * class to track user input.
 * @param {Element} element The element to apply the event listener to.
 */
Input.applyEventHandlers = function() {
  	document.addEventListener('mousedown', Input.onMouseDown);
  	document.addEventListener('mouseup', Input.onMouseUp);
  	document.addEventListener('keyup', Input.onKeyUp);
  	document.addEventListener('keydown', Input.onKeyDown);
};

/**
 * This should be called any time an element needs to track mouse coordinates
 * over it. The event listener will be applied to the entire document, but the
 * the coordinates will be taken relative to the given element (using the given
 * element's top left as [0, 0]).
 * @param {Element} element The element to take the coordinates relative to.
 */
Input.addMouseTracker = function(element) {
  	document.addEventListener('mousemove', (event) => {
    	Input.MOUSE = [event.pageX - element.offsetLeft,
                   	   event.pageY - element.offsetTop];
    	Input.LAST_INPUT_RECEIVED = new Date();
  	});
};

Input.addTouchTracker = function(element) {
    document.addEventListener('touchstart', (event) => {
        Input.MOUSE = [event.touches[0].clientX - element.offsetLeft,
                       event.touches[0].clientY - element.offsetTop];
        Input.LEFT_CLICK = true;
        Input.LAST_INPUT_RECEIVED = new Date();
    });

    document.addEventListener('touchend', (event) => {
        Input.MOUSE = [-1,-1];
        Input.LEFT_CLICK = false;
        Input.LAST_INPUT_RECEIVED = new Date();
    });
}
