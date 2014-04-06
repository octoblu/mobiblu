// Wait for Cordova to load
window.onload = function(){
    document.addEventListener("deviceready", onDeviceReady, false);
};

var watchID = null;

// Cordova is ready
function onDeviceReady() {
    // Throw an error if no update is received every 30 seconds

}

function trackAcceleration(){
    var el = document.getElementById('acceleration');
    if(el){
        var options = { frequency: 3000 };  // Update every 3 seconds
        watchID = navigator.accelerometer.watchAcceleration(onAccSuccess, onAccError, options);
    }
}

// onSuccess Geolocation
//
function onAccSuccess(acceleration) {
    var el = document.getElementById('acceleration');
    el.innerHTML = 'Acceleration X: ' + acceleration.x + '<br>' +
                            'Acceleration Y: ' + acceleration.y + '<br>' +
                            'Acceleration Z: ' + acceleration.z + '<br>' +
                            'Timestamp: '      + acceleration.timestamp + '<br>' +
                            '<hr />'      + el.innerHTML;
}

// onError Callback receives a PositionError object
//
function onAccError(error) {
    alert('code: '    + error.code    + '\n' +
          'message: ' + error.message + '\n');
}
