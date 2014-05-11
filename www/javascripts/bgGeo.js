window.load = function () {
    var bgGeo = window.plugins.backgroundGeoLocation;

    var mobileuuid = window.localStorage.getItem("mobileuuid"),
        mobiletoken = window.localStorage.getItem("mobiletoken");
    // Send POST to SkyNet
    var sendToSkynet = function (response) {

        $.ajax({
            url: "http://skynet.im/data/" + mobileuuid + '?token=' + mobiletoken,
            type: "POST",
            timeout: 30000,
            data: {
                "token": mobiletoken,
                "sensorData": {
                    "type": "Geolocation",
                    "data": response
                }
            },
            success: function (data, textStatus) {
                console.log("Received response HTTP " + textStatus + " (http://skynet.im/data/");
                console.log(data);
            },
            error: function (jqXHR, textStatus, errorThrown) {
                console.log("Error during request " + textStatus + " (http://skynet.im/data/)");
                console.log(errorThrown);
            },
        });

        // App will crash if finish isn't called
        bgGeo.finish();
    };

    /**
     * This callback will be executed every time a geolocation is recorded in the background.
     */
    var callbackFn = function (location) {
        console.log('[js] BackgroundGeoLocation callback:  ' + location.latitudue + ',' + location.longitude);


        sendToSkynet.call(this);
    };

    var failureFn = function (error) {
        console.log('BackgroundGeoLocation error');
    };

    // BackgroundGeoLocation is highly configurable.
    bgGeo.configure(callbackFn, failureFn, {
        url: 'http://skynet.im/data/' + mobileuuid + '?token=' + mobiletoken, // <-- only required for Android; ios allows javascript callbacks for your http
        params: { // HTTP POST params sent to your server when persisting locations.
            token: mobiletoken,
        },
        desiredAccuracy: 10,
        stationaryRadius: 20,
        distanceFilter: 30,
        debug: true // <-- enable this hear sounds for background-geolocation life-cycle.
    });

    if(mobileuuid && mobiletoken){
        // Turn ON the background-geolocation system.  The user will be tracked whenever they suspend the app.
        bgGeo.start();
    }

    // If you wish to turn OFF background-tracking, call the #stop method.
    // bgGeo.stop()

};
