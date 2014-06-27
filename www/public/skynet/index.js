'use strict';

var Sensors = require('./sensors.js');
var activity = require('./activity.js');
var SkynetRest = require('./skynet.js');
var Q = require('Q');

var app = {};

app.loaded = false;

app.defaultSettings = {
    compass: true,
    accelerometer: true,
    geolocation: true,
    update_interval: 1,
    bg_updates: true,
    developer_mode: false
};

app.setData = function () {
    var devicename = window.localStorage.getItem('devicename');

    app.devicename = devicename && devicename.length ? devicename : 'Octoblu Mobile';
    // Octoblu User Data
    app.skynetuuid = window.localStorage.getItem('skynetuuid');
    app.skynettoken = window.localStorage.getItem('skynettoken');
    //Push ID
    app.pushID = window.localStorage.getItem('pushID');
    // Logged In
    app.loggedin = !!window.localStorage.getItem('loggedin');
    // Mobile App Data
    app.mobileuuid = window.localStorage.getItem('mobileuuid');
    app.mobiletoken = window.localStorage.getItem('mobiletoken');

    app.settings = app.defaultSettings;

    app.settingsUpdated = false;

    app.sensorIntervals = {};

};

app.logout = function () {

    window.localStorage.removeItem('skynetuuid');
    window.localStorage.removeItem('skynettoken');
    app.skynetuuid = null;
    app.skynettoken = null;

    window.loggedin = app.loggedin = false;
    window.localStorage.removeItem('loggedin');

    window.localStorage.removeItem('skynetactivity');

    app.setData();

    window.open('http://app.octoblu.com/logout?js=1&referrer=' + encodeURIComponent('http://localhost/index.html#!/login'), '_self', 'location=yes');

};

app.login = function () {
    window.open('http://app.octoblu.com/login?js=1&referrer=' + encodeURIComponent('http://localhost/login.html'), '_self', 'location=yes');
};

app.isAuthenticated = function () {
    return !!(app.loggedin && app.skynetuuid && app.skynettoken);
};

app.isRegistered = function () {
    var deferred = Q.defer();

    app.whoami(null, null)
        .timeout(1000 * 5)
        .then(function (data) {
            if (data.uuid === app.mobileuuid) {
                deferred.resolve(true);
            } else {
                deferred.resolve(false);
            }
        }, function () {
            activity.logActivity({
                type: 'Skynet',
                error: new Error('Error Checking Skynet')
            });
            deferred.reject('Error Checking Skynet');
        });

    return deferred.promise;
};

app.registerPushID = function () {
    var deferred = Q.defer();

    document.addEventListener('urbanairship.registration',
        function (event) {
            if (event.error) {
                console.log('Urbanairship Registration Error');
                deferred.reject('Urbanairship Registration Error');
            } else {
                app.pushID = event.pushID;
                window.localStorage.setItem('pushID', app.pushID);

                steroids.addons.urbanairship
                    .notifications.onValue(function (notification) {
                        activity.logActivity({
                            type: 'PushNotification',
                            html: notification.message
                        });
                    });

                app.updateDeviceSetting({})
                    .then(function () {
                        activity.logActivity({
                            type: 'PushNotification',
                            html: 'Push ID Registered'
                        });
                        deferred.resolve();
                    }, function () {
                        activity.logActivity({
                            type: 'PushNotification',
                            error: new Error('Push ID Updated Failed')
                        });
                        deferred.reject('Push ID Updated Failed');
                    });
            }
        }, false);

    return deferred.promise;
};

app.startProcesses = function () {

    if (!app.loaded) {

        app.loaded = true;

        app.registerPushID();

        app.skynetSocket.on('message', function (data) {
            activity.logActivity({
                type: 'SkynetMessage',
                html: 'From: ' + data.fromUuid +
                    '<br>Message: ' + data.payload
            });
        });

    }

    app.logSensorData();
    app.startBG();
};

app.registerDevice = function () {

    console.log('Registering...');

    var deferred = Q.defer();

    var regData = {
        'name': app.devicename,
        'owner': app.skynetuuid,
        'type': 'octobluMobile',
        'online': true
    };

    if(app.mobileuuid && app.mobiletoken){
        regData.uuid = app.mobileuuid;
        regData.token = app.mobiletoken;
    }

    if (app.pushID) regData.pushID = app.pushID;

    app.skynetSocket.emit(
        'register',
        regData,
        function (data) {

            data.mobileuuid = data.uuid;
            data.mobiletoken = data.token;

            app.mobileuuid = data.mobileuuid;
            app.mobiletoken = data.mobiletoken;

            window.localStorage.setItem('mobileuuid', data.uuid);
            window.localStorage.setItem('mobiletoken', data.token);
            window.localStorage.setItem('devicename', data.name);

            deferred.resolve();
        });
    return deferred.promise;
}

app.register = function (registered) {


    var deferred = Q.defer();

    if (registered) {

        // Already Registered & Update the device
        app.updateDeviceSetting({}).then(deferred.resolve, deferred.reject);

    } else {

        // Register new Device
        app.registerDevice().then(deferred.resolve, deferred.reject);

    }

    return deferred.promise;

};

app.connect = function(data) {

    console.log('Connecting to skynet...');

    var deferred = Q.defer();

    if(!data){
        data = {
            'uuid': app.mobileuuid || app.skynetuuid,
            'token': app.mobiletoken || app.skynettoken
        };
    }

    if (app.skynetSocket) {
        console.log('Skynet Socket already established.');
        return app.getDeviceSetting(null, null)
            .then(deferred.resolve, deferred.reject);
    }
    // GETS HERE
    app.skynetClient = skynet(data, function (e, socket) {
        var registered = true;
        if (e) {
            console.log(e.toString());
            registered = false;
        }
        if(socket){
            app.skynetSocket = socket;
            app.register(registered)
                .then(deferred.resolve, deferred.reject);
        }else{
            deferred.reject('Error Authenticating with Skynet');
        }
    });

    return deferred.promise;
};


app.logSensorData = function () {
    var sensors = [];

    app.getDeviceSetting()
        .then(function () {
            // Push Sensors
            if (!app.settings || app.settings.geolocation) sensors.push('Geolocation');
            if (!app.settings || app.settings.compass) sensors.push('Compass');
            if (!app.settings || app.settings.accelerometer) sensors.push('Accelerometer');

            var wait = 1;

            if (app.settings) {
                if (app.settings.update_interval) {
                    wait = app.settings.update_interval;
                } else if (app.settings.update_interval === 0) {
                    wait = 0.15;
                }
            }
            // Convert min to ms
            wait = wait * 60 * 1000;

            var throttled = {};


            var startSensor = function (sensor, type) {
                var sent = false;
                sensor.start(
                    // Handle Success
                    function (sensorData) {
                        // Make sure it hasn't already been sent
                        if (sent) return;
                        sent = true;

                        // Emit data
                        app.skynetSocket.emit('data', {
                            'uuid': app.mobileuuid,
                            'token': app.mobiletoken,
                            'sensorData': {
                                'type': type,
                                'data': sensorData
                            }
                        }, function () {
                            activity.logActivity({
                                type: type,
                                data: sensorData,
                                html: sensor.prettify(sensorData)
                            });
                        });

                    },
                    // Handle Errors
                    function (err) {
                        activity.logActivity({
                            type: type,
                            error: err
                        });
                    }
                );
            };

            sensors.forEach(function (sensorType) {
                if (sensorType && typeof Sensors[sensorType] === 'function') {
                    if (app.sensorIntervals[sensorType]) {
                        clearInterval(app.sensorIntervals[sensorType]);
                    }
                    throttled[sensorType] = _.throttle(startSensor, wait);
                    // Trigger Sensor Data every wait
                    var sensorObj = Sensors[sensorType](1000);
                    app.sensorIntervals[sensorType] = setInterval(function () {
                        throttled[sensorType](sensorObj, sensorType);
                    }, wait);
                }
            });
        });
    };

app.startBG = function () {
    // If BG Updates is turned off
    Sensors.Geolocation(1000).start(function () {
        app.bgGeo = window.plugins ? window.plugins.backgroundGeoLocation : null;

        if (!app.bgGeo) {
            return;
        }

        if (!app.settings.bg_updates) return app.bgGeo.stop();

        // Send POST to SkyNet
        var sendToSkynet = function (response) {
            var send = JSON.stringify({
                'sensorData': {
                    'type': 'Geolocation',
                    'data': response
                }
            });
            console.log(send);

            var r = new XMLHttpRequest();
            r.open('POST', 'http://skynet.im/data/' + app.mobileuuid, true);
            r.setRequestHeader('Content-type', 'application/json');
            r.setRequestHeader('skynet_auth_uuid', app.mobileuuid);
            r.setRequestHeader('skynet_auth_token', app.mobiletoken);

            r.onreadystatechange = function () {
                if (r.readyState !== 4 || r.status !== 200) return;
                console.log('Success: ' + r.responseText);

                activity.logActivity({
                    type: 'BG_Geolocation',
                    html: 'Successfully updated background location'
                });
            };

            r.send(send);
            app.bgGeo.finish();
        };

        var callbackFn = function (location) {
            sendToSkynet(location);
        };

        var failureFn = function (err) {
            activity.logActivity({
                type: 'BG_Geolocation',
                error: err
            });

            console.log('BackgroundGeoLocation error');
        };

        // BackgroundGeoLocation is highly configurable.
        app.bgGeo.configure(callbackFn, failureFn, {
            url: 'http://skynet.im/data/' + app.mobileuuid, // <-- only required for Android; ios allows javascript callbacks for your http
            params: { // HTTP POST params sent to your server when persisting locations.
            },
            headers: {
                'skynet_auth_uuid': app.mobileuuid,
                'skynet_auth_token': app.mobiletoken
            },
            desiredAccuracy: 10,
            stationaryRadius: 20,
            distanceFilter: 30,
            debug: false // <-- enable this hear sounds for background-geolocation life-cycle.
        });

        app.bgGeo.start();

    }, function (err) {
        console.log('Error', err);
    });

};

app.updateDeviceSetting = function (data) {
    var deferred = Q.defer();
    // Extend the data option
    data.uuid = app.mobileuuid;
    data.token = app.mobiletoken;
    data.online = true;
    data.owner = app.skynetuuid;
    data.pushID = app.pushID;
    data.name = data.name || app.devicename;
    app.type = 'octobluMobile';

    if (data.setting) app.settings = data.setting;

    app.devicename = data.name;

    app.skynetSocket.emit('update', data, deferred.resolve);

    return deferred.promise;
};

app.message = function (data) {
    var deferred = Q.defer();
    if (!data.uuid) data.uuid = app.mobileuuid;
    if (!data.token) data.token = app.mobiletoken;

    app.skynetSocket.emit('message', data, function (d) {
        activity.logActivity({
            type: 'SentMessage',
            html: 'Sending Message: ' + JSON.stringify(data.payload)
        });
        deferred.resolve(d);
    });

    return deferred.promise;
};

app.whoami = function (uuid, token, callback) {
    var deferred = Q.defer();

    app.skynetSocket.emit('whoami', {
        uuid: uuid || app.mobileuuid,
        token: token || app.mobiletoken
    }, deferred.resolve);

    return deferred.promise;
};

app.getDeviceSetting = function (uuid, token) {
    var deferred = Q.defer();

    if (app.settingsUpdated) {
        return deferred.resolve({
            setting: app.settings
        });
    }
    SkynetRest.getDevice(
            uuid || app.mobileuuid,
            token || app.mobiletoken)
        .then(function (data) {
            var device;

            if (!data) return deferred.reject('No Device Found');

            if (data.devices && data.devices.length) {
                device = data.devices[0];
            } else {
                device = data;
            }
            if (!uuid || uuid !== app.mobileuuid) {
                if (device.setting) {
                    app.settingsUpdated = true;
                    app.settings = device.setting;
                } else {
                    app.settings = app.defaultSettings;
                }
            }

            deferred.resolve(device);
        }, function(err){
            console.log(err);
            deferred.reject('Unable to Retrieve Device');
        });
    return deferred.promise;
};

app.init = function () {
    var deferred = Q.defer();
    app.setData();

    activity.init();

    if (app.isAuthenticated()) {
        app.connect()
            .then(deferred.resolve, deferred.reject);
    } else {
        deferred.reject('Unauthenticated');
    }

    return deferred.promise.timeout(1000 * 5)
        .then(function () {
            app.startProcesses();
            $(document).trigger('skynet-loaded');
        });
};

app.setData();

var publicApi = {
    initilized: true,
    init: app.init,
    getDeviceSetting: app.getDeviceSetting,
    whoami: app.whoami,
    message: app.message,
    updateDeviceSetting: app.updateDeviceSetting,
    logout: app.logout,
    login: app.login,
    isAuthenticated: app.isAuthenticated,
    logSensorData: app.logSensorData,
    getCurrentSettings: function () {
        return {
            skynetSocket: app.skynetSocket,
            devicename: app.devicename,
            loggedin: app.loggedin,
            mobileuuid: app.mobileuuid,
            mobiletoken: app.mobiletoken,
            skynetuuid: app.skynetuuid,
            skynettoken: app.skynettoken,
            settings: app.settings
        };
    },
    Sensors: Sensors,
    clearActivityCount: activity.clearActivityCount,
    getActivity: activity.getActivity,
    logActivity: activity.logActivity
};


module.exports = publicApi;