'use strict';

var limit = 50;

function storeSensor(name, data) {
    var stored = mobibluStorage.getItem(name) || [];
    stored.unshift(data);
    stored = stored.slice(0, limit);
    mobibluStorage.setItem(name, stored);
    return stored;
}

function retrieveSensor(name) {
    return mobibluStorage.getItem(name) || [];
}

function clearSensor(name) {
    return mobibluStorage.removeItem(name);
}

var sensorIntervals = {};

var Sensors = {
    // Accelerometer apiect
    Accelerometer: function (timeout) {
        var watchID = null;
        var name = 'Accelerometer';

        function watch(onSuccess, onError) {
            var options = {
                frequency: timeout
            }; // Update every 3 seconds
            watchID = navigator.accelerometer
                .watchAcceleration(function (data) {
                    onSuccess(data, store(data));
                }, onError, options);
        }

        function start(onSuccess, onError) {
            watchID = navigator.accelerometer
                .getCurrentAcceleration(function (data) {
                    onSuccess(data, store(data));
                }, onError);
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
                'Timestamp: ' + acceleration.timestamp + '<br>';
        }

        function store(data) {
            return storeSensor(name, data);
        }

        function retrieve() {
            return retrieveSensor(name);
        }

        function clearStorage(){
            return clearSensor(name);
        }

        return {
            watch: watch,
            start: start,
            clear: clear,
            prettify: prettify,
            store: store,
            retrieve: retrieve,
            clearStorage : clearStorage,
            stream: true,
            name: name
        };
    },
    // Compass apiect
    Compass: function (timeout) {
        var watchID = null,
            name = 'Compass';

        function watch(onSuccess, onError) {
            var options = {
                frequency: timeout
            }; // Update every 3 seconds
            watchID = navigator.compass
                .watchHeading(function (data) {
                    onSuccess(data, store(data));
                }, onError, options);
        }

        function start(onSuccess, onError) {
            navigator.compass
                .getCurrentHeading(function (data) {
                    onSuccess(data, store(data));
                }, onError);
        }

        function clear() {
            if (watchID) {
                navigator.compass.clearWatch(watchID);
                watchID = null;
            }
        }

        // Return HTML pretty print of data
        function prettify(heading) {
            return 'Heading: ' + heading.magneticHeading + '<br />';
        }

        function store(data) {
            return storeSensor(name, data);
        }

        function retrieve() {
            return retrieveSensor(name);
        }

        function clearStorage(){
            return clearSensor(name);
        }

        return {
            watch: watch,
            start: start,
            clear: clear,
            prettify: prettify,
            store: store,
            retrieve: retrieve,
            clearStorage : clearStorage,
            stream: false,
            name: name
        };
    },

    // Geolocation api
    Geolocation: function () {
        var watchID = null,
            name = 'Geolocation';

        function watch(onSuccess, onError) {
            var options = {
                timeout: 30000
            };
            watchID = navigator.geolocation
                .watchPosition(function (data) {
                    onSuccess(data, store(data));
                }, onError, options);
        }

        function start(onSuccess, onError) {
            navigator.geolocation
                .getCurrentPosition(function (data) {
                    onSuccess(data, store(data));
                }, onError);
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
                'Longitude: ' + position.coords.longitude + '<br />';
        }

        function store(data) {
            return storeSensor(name, data);
        }

        function retrieve() {
            return retrieveSensor(name);
        }

        function clearStorage(){
            return clearSensor(name);
        }

        return {
            watch: watch,
            start: start,
            clear: clear,
            prettify: prettify,
            retrieve: retrieve,
            store: store,
            stream: true,
            clearStorage : clearStorage,
            name: name
        };
    }
};

Sensors.logSensorData = function(app, activity) {
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
                    activity.logActivity({
                        type: type,
                        data: sensorData,
                        html: sensor.prettify(sensorData)
                    });
                });

            },
            // Handle Errors
            function(err) {
                activity.logActivity({
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
                    var sensorObj = Sensors[sensorType](1000);
                    sensorIntervals[sensorType] = setInterval(function() {
                        throttled[sensorType](sensorObj, sensorType);
                    }, wait);

                }

            });
        });
};

module.exports = Sensors;