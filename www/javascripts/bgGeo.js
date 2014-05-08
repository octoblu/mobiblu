window.load = function(){
window.navigator.geolocation.getCurrentPosition(function (location) {
    console.log('Location from Phonegap');
});

var bgGeo = window.plugins.backgroundGeoLocation;

/**
 * This would be your own callback for Ajax-requests after POSTing background geolocation to your server.
 */
var yourAjaxCallback = function (response) {
    ////
    // IMPORTANT:  You must execute the #finish method here to inform the native plugin that you're finished,
    //  and the background-task may be completed.  You must do this regardless if your HTTP request is successful or not.
    // IF YOU DON'T, ios will CRASH YOUR APP for spending too much time in the background.
    //
    //
    bgGeo.finish();
};

/**
 * This callback will be executed every time a geolocation is recorded in the background.
 */
var callbackFn = function (location) {
    console.log('[js] BackgroundGeoLocation callback:  ' + location.latitudue + ',' + location.longitude);
    // Do your HTTP request here to POST location to your server.
    //
    //
    yourAjaxCallback.call(this);
};

var failureFn = function (error) {
    console.log('BackgroundGeoLocation error');
};

// BackgroundGeoLocation is highly configurable.
bgGeo.configure(callbackFn, failureFn, {
    url: 'http://only.for.android.com/update_location.json', // <-- only required for Android; ios allows javascript callbacks for your http
    params: { // HTTP POST params sent to your server when persisting locations.
        auth_token: 'user_secret_auth_token',
        foo: 'bar'
    },
    desiredAccuracy: 10,
    stationaryRadius: 20,
    distanceFilter: 30,
    debug: true // <-- enable this hear sounds for background-geolocation life-cycle.
});

// Turn ON the background-geolocation system.  The user will be tracked whenever they suspend the app.
bgGeo.start();

// If you wish to turn OFF background-tracking, call the #stop method.
// bgGeo.stop()

};
