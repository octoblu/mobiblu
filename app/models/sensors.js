var module = angular.module('SensorModel', []);
module.factory('Sensors', function ($rootScope) {
    var obj = {
        // Accelerometer object
        Accelerometer: function () {
            var watchID = null;

            function start(onSuccess, onError) {
                var options = {
                    frequency: 3000
                }; // Update every 3 seconds
                watchID = navigator.accelerometer.watchAcceleration(onSuccess, onError, options);
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
                start: start,
                clear: clear,
                prettify: prettify,
                stream: true
            };
        },
        // Accelerometer object
        Compass: function () {
            var watchID = null;

            function start(onSuccess, onError) {
                var options = {
                    frequency: 3000
                }; // Update every 3 seconds
                watchID = navigator.compass.watchHeading(onSuccess, onError, options);
            }

            function clear() {
                if (watchID) {
                    navigator.compass.clearWatch(watchID);
                    watchID = null;
                }
            }

            // Return HTML pretty print of data
            function prettify(heading) {
                return 'Heading: ' + heading.magneticHeading;
            }

            return {
                start: start,
                clear: clear,
                prettify: prettify,
                stream: false
            };
        },

        // Accelerometer object
        Geolocation: function () {
            var watchID = null;

            function start(onSuccess, onError) {
                var options = {
                    timeout: 30000
                };
                watchID = navigator.geolocation.watchPosition(onSuccess, onError, options);
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
                start: start,
                clear: clear,
                prettify: prettify,
                stream: true
            };
        }
    };
    return obj;
});
