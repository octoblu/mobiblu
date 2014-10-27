'use strict';

angular.module('main.sensors')
  .service('Sensors', function(Activity, Accelerometer, Compass, Geolocation) {

    var sensorIntervals = {};

    var Sensors = {
    	Accelerometer : Accelerometer,
    	Compass : Compass,
    	Geolocation : Geolocation
    };

    var self = Sensors;
    self.logSensorData = function(app) {
      var sensors = [];

      // Clear Session Timeouts
      if (sensorIntervals) {
        console.log('Clearing Sensors');
        _.each(_.keys(sensorIntervals), function(key) {
          clearInterval(sensorIntervals[key]);
        });
      }

      var startSensor = function(sensor, type) {
        var sent = false;
        sensor.start(
          // Handle Success
          function(sensorData) {
            // Make sure it hasn't already been sent
            if (sent) return;
            sent = true;

            // Emit data
            app.sendData({
              'sensorData': {
                'type': type,
                'data': sensorData
              }
            }).then(function() {
              Activity.logActivity({
                type: type,
                data: sensorData,
                html: sensor.prettify(sensorData)
              });
            });

          },
          // Handle Errors
          function(err) {
            Activity.logActivity({
              type: type,
              error: err
            });
          }
        );
      };

      app.getDeviceSetting()
        .then(function() {
          // Push Sensors

          var wait = 1;

          if (app.settings) {
            // Geolocation
            if (app.settings.geolocation)
              sensors.push('Geolocation');
            // Compass
            if (app.settings.compass)
              sensors.push('Compass');
            // Accelerometer
            if (app.settings.accelerometer)
              sensors.push('Accelerometer');

            if (app.settings.update_interval) {
              wait = app.settings.update_interval;
            } else if (app.settings.update_interval === 0) {
              wait = 0.15;
            }
          }
          console.log('Active Sensors (' + wait + '), ' + JSON.stringify(sensors));
          // Convert min to ms
          wait = wait * 60 * 1000;

          var throttled = {};

          sensors.forEach(function(sensorType) {

            if (sensorType && typeof Sensors[sensorType] === 'function') {

              throttled[sensorType] = _.throttle(startSensor, wait);
              // Trigger Sensor Data every wait
              var sensorObj = new Sensors[sensorType](1000);
              sensorIntervals[sensorType] = setInterval(function() {
                throttled[sensorType](sensorObj, sensorType);
              }, wait);

            }

          });
        });
    };

    return self;

  });