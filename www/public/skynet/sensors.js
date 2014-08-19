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

module.exports = {
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

    // Geolocation apiect
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