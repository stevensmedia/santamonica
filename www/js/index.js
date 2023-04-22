function onDeviceReady() {
	window.removeMenu();

	console.log('Running cordova-' + cordova.platformId + '@' + cordova.version);
}
document.addEventListener('deviceready', onDeviceReady, false);
