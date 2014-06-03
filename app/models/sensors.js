'use strict';

var sensorModel = angular.module('SensorModel', []);
sensorModel.factory('Sensors', function () {
    var obj = {
        // Accelerometer object
        Accelerometer: function (timeout) {
            var watchID = null;

            function watch(onSuccess, onError) {
                var options = {
                    frequency: timeout
                }; // Update every 3 seconds
                watchID = navigator.accelerometer.watchAcceleration(onSuccess, onError, options);
            }

            function start(onSuccess, onError) {
                watchID = navigator.accelerometer.getCurrentAcceleration(onSuccess, onError);
            }

            function clear() {
                if (watchID) {
                    navigator.accelerometer.clearWatch(watchID);
                    watchID = null;
                }
            }

            // Return HTML pretty print of data
            function prettify(acceleration) {
                return 'Acceleration X: ' + acceleration.x + '<br>' +
                    'Acceleration Y: ' + acceleration.y + '<br>' +
                    'Acceleration Z: ' + acceleration.z + '<br>' +
                    'Timestamp: ' + acceleration.timestamp + '<br>' +
                    '<hr />';
            }

            return {
                watch : watch,
                start: start,
                clear: clear,
                prettify: prettify,
                stream: true,
                name : 'Accelerometer'
            };
        },
        // Compass object
        Compass: function (timeout) {
            var watchID = null;

            function watch(onSuccess, onError) {
                var options = {
                    frequency: timeout
                }; // Update every 3 seconds
                watchID = navigator.compass.watchHeading(onSuccess, onError, options);
            }

            function start(onSuccess, onError) {
                navigator.compass.getCurrentHeading(onSuccess, onError);
            }

            function clear() {
                if (watchID) {
                    navigator.compass.clearWatch(watchID);
                    watchID = null;
                }
            }

            // Return HTML pretty print of data
            function prettify(heading) {
                return 'Heading: ' + heading.magneticHeading + '<hr>';
            }

            return {
                watch : watch,
                start: start,
                clear: clear,
                prettify: prettify,
                stream: false,
                name : 'Compass'
            };
        },

        // Geolocation object
        Geolocation: function () {
            var watchID = null;

            function watch(onSuccess, onError) {
                var options = {
                    timeout: 30000
                };
                watchID = navigator.geolocation.watchPosition(onSuccess, onError, options);
            }

            function start(onSuccess, onError) {
                navigator.geolocation.getCurrentPosition(onSuccess, onError);
            }


            function clear() {
                if (watchID) {
                    navigator.geolocation.clearWatch(watchID);
                    watchID = null;
                }
            }

            // Return HTML pretty print of data
            function prettify(position) {
                return 'Latitude: ' + position.coords.latitude + '<br />' +
                    'Longitude: ' + position.coords.longitude + '<br />' +
                    '<hr />';
            }

            return {
                watch : watch,
                start: start,
                clear: clear,
                prettify: prettify,
                stream: true,
                name : 'Geolocation'
            };
        }
    };
    return obj;
});
