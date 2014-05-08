window.load = function () {
    var bgGeo = window.plugins.backgroundGeoLocation;

    // Send POST to SkyNet
    var sendToSkynet = function (response) {

        // App will crash if finish isn't called
        bgGeo.finish();
    };

    /**
     * This callback will be executed every time a geolocation is recorded in the background.
     */
    var callbackFn = function (location) {
        console.log('[js] BackgroundGeoLocation callback:  ' + location.latitudue + ',' + location.longitude);

        $.ajax({
            url: "http://skynet.im/data/" + mobileuuid,
            type: "POST",
            timeout: 30000,
            data: {
                "token": mobiletoken,
            },
            success: function (data, textStatus) {
                console.log("Received response HTTP " + textStatus + " (http://skynet.im/data/c3d389e1-d638-11e3-922d-bd3555246855)");
                console.log(data);
            },
            error: function (jqXHR, textStatus, errorThrown) {
                console.log("Error during request " + textStatus + " (http://skynet.im/data/c3d389e1-d638-11e3-922d-bd3555246855)");
                console.log(errorThrown);
            },
        });

        sendToSkynet.call(this);
    };

    var failureFn = function (error) {
        console.log('BackgroundGeoLocation error');
    };

    // BackgroundGeoLocation is highly configurable.
    bgGeo.configure(callbackFn, failureFn, {
        url: 'http://skynet.im/data/' + mobileuuid, // <-- only required for Android; ios allows javascript callbacks for your http
        params: { // HTTP POST params sent to your server when persisting locations.
            token: mobiletoken,
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
