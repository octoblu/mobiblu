'use strict';

var SkynerRest = require('./skynet.js');
var activtiy = require('./activity.js');
var Sensors = require('./sensors.js');

var type = 'Background Geolocation';

var bgGeo;

function getBGPlugin() {
    bgGeo = window.plugins ? window.plugins.backgroundGeoLocation : null;

    if (!bgGeo) {
        console.log('No BG Plugin');
        return false;
    }

    return true;
}

module.exports = {

    startBG : function(app, activity) {
        if (!getBGPlugin()) return;

        console.log('Started BG Location');

        if (!app.settings.bg_updates) return app.stopBG();

        // If BG Updates is turned off
        Sensors.Geolocation(1000).start(function() {
            // Send POST to SkyNet
            var sendToSkynet = function(response) {

                SkynetRest.sendData(app.mobileuuid, app.mobiletoken, {
                    'sensorData': {
                        'type': type,
                        'data': response
                    }
                }).then(
                // ON SUCCESS
                function() {

                    Sensors[type].store(response);

                    activity.logActivity({
                        type: type,
                        html: 'Successfully updated background location'
                    });

                    bgGeo.finish();

                },
                // ON ERROR
                function(){
                    activity.logActivity({
                        type: type,
                        error: 'Failed to update background location'
                    });
                    bgGeo.finish();
                });

            };

            var callbackFn = function(location) {
                sendToSkynet(location);
            };

            var failureFn = function(err) {
                activity.logActivity({
                    type: type,
                    error: err
                });
            };

            // BackgroundGeoLocation is highly configurable.
            bgGeo.configure(callbackFn, failureFn, {
                url: 'http://meshblu.octoblu.com/data/' + app.mobileuuid, // <-- only required for Android; ios allows javascript callbacks for your http
                params: { // HTTP POST params sent to your server when persisting locations.
                    uuid: app.mobileuuid,
                    token: app.mobiletoken,
                    type: 'octobluMobile'
                },
                headers: {
                    skynet_auth_uuid: app.mobileuuid,
                    skynet_auth_token: app.mobiletoken
                },
                desiredAccuracy: 100,
                stationaryRadius: 100,
                distanceFilter: 30,
                debug: false // <-- enable this hear sounds for background-geolocation life-cycle.
            });

            app.bgRunning = true;

            bgGeo.start();

        }, function(err) {
            console.log('Error', err);
        });

    },

    stopBG : function(app, activity) {

        if (!getBGPlugin()) return;

        console.log('Stopping BG Location');

        bgGeo.stop();

        if (app.bgRunning) {
            activity.logActivity({
                type: type,
                html: 'Stopped Background Location'
            });
        }

        app.bgRunning = false;
    }

};