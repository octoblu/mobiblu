'use strict';

angular.module('main.skynet')
  .service('BGLocation', function(Sensors, Config, Activity, SkynetRest) {

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

    var bg = {

      startBG: function(app) {
        if (!getBGPlugin()) return;

        if (!app.settings.bg_updates) return bg.stopBG(app, Activity);

        console.log('Started: ' + type);

        var GeoSensor = Sensors.Geolocation(1000);
        // If BG Updates is turned off
        GeoSensor.start(function() {
          // Send POST to SkyNet
          var sendToSkynet = function(response) {

            response.coords = {
              latitude: response.latitude,
              longitude: response.longitude
            };

            response.type = type;

            console.log('Sending ' + type + ' to Meshblu: ' +
              JSON.stringify(response));

            function onSuccess() {
              GeoSensor.store(response);

              Activity.logActivity({
                type: type,
                html: 'Successfully updated ' + type
              });

              bgGeo.finish();
            }

            function onFailure() {
              Activity.logActivity({
                debug: true,
                type: type,
                error: 'Failed to update ' + type
              });
              bgGeo.finish();
            }

            SkynetRest
              .sendData(app.mobileuuid, app.mobiletoken, {
                'sensorData': {
                  'type': type,
                  'data': response
                }
              }).then(onSuccess, onFailure);
          };

          var callbackFn = function(location) {
            sendToSkynet(location);
          };

          var failureFn = function(err) {
            Activity.logActivity({
              type: type,
              error: err
            });
          };

          Activity.logActivity({
            type: type,
            html: 'Started Background Location'
          });

          // BackgroundGeoLocation is highly configurable.
          bgGeo.configure(callbackFn, failureFn, {
            url: Config.SKYNET_URL + '/data/' + app.mobileuuid, // <-- only required for Android; ios allows javascript callbacks for your http
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
            ActivityType: 'OtherNavigation',
            debug: false // <-- Enable for Debug Sounds on Android
          });

          app.bgRunning = true;

          bgGeo.start();

        }, function(err) {
          console.log('Error', err);
        });

      },

      stopBG: function(app) {

        if (!getBGPlugin()) return;

        console.log('Stopped: ' + type);

        bgGeo.stop();

        if (app.bgRunning) {
          Activity.logActivity({
            type: type,
            html: 'Stopped Background Location'
          });
        }

        app.bgRunning = false;
      }

    };

    return bg;
  });