// 'use strict';
let deferredInstallPrompt = null;
var installButton;

$(document).ready(function() {
	installButton = $("button#install");
	installButton.toggle(false);
	$("button#install").on("click", installPWA);
});


window.addEventListener('load', function() {
	if (navigator.standalone) {
	    console.log('Launched: Installed (iOS)');
	} else if (matchMedia('(display-mode: standalone)').matches) {
	    console.log('Launched: Installed');
	} else {
	    console.log('Launched: Browser Tab');
	}
	// $("#title").css("color","black");
});


// CODELAB: Add event listener for beforeinstallprompt event
window.addEventListener('beforeinstallprompt', e => {
	e.preventDefault();
	deferredInstallPrompt = e;
	installButton.toggle(true);
});

/**
 * Event handler for beforeinstallprompt event.
 *   Saves the event & shows install button.
 *
 * @param {Event} evt
 */
function saveBeforeInstallPromptEvent(evt) {
  	// CODELAB: Add code to save event & show the install button.
  	deferredInstallPrompt = evt;
	installButton.toggle(true);
}


/**
 * Event handler for butInstall - Does the PWA installation.
 *
 * @param {Event} evt
 */
function installPWA(evt) {
  	// CODELAB: Add code show install prompt & hide the install button.
  	deferredInstallPrompt.prompt();
  	// Hide the install button, it can't be called twice.
  	installButton.toggle(false);

  	// CODELAB: Log user response to prompt.
  	deferredInstallPrompt.userChoice.then((choice) => {
	    if (choice.outcome === 'accepted') {
	      	console.log('User accepted the App to Home Screen prompt', choice);
	    } else {
	        console.log('User dismissed the App to Home Screen prompt', choice);
	    }
	    deferredInstallPrompt = null;
    });
}

// CODELAB: Add event listener for appinstalled event
window.addEventListener('appinstalled', logAppInstalled);

/**
 * Event handler for appinstalled event.
 *   Log the installation to analytics or save the event somehow.
 *
 * @param {Event} evt
 */
function logAppInstalled(evt) {
  	// CODELAB: Add code to log the event
  	console.log('Keep Out App was installed.', evt);
}