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

app.conn = null;

app.setData = function () {
    var skynetuuid = window.localStorage.getItem('skynetuuid'),
        skynettoken = window.localStorage.getItem('skynettoken');

    // Set new Skynet Tokens
    if (skynetuuid && skynettoken) {
        console.log('Credentials set');
        // Octoblu User Data
        app.skynetuuid = skynetuuid;
        app.skynettoken = skynettoken;
        // Logged In
        app.loggedin = !!window.localStorage.getItem('loggedin');
        //Push ID
        app.pushID = window.localStorage.getItem('pushID');
        // Mobile App Data
        app.mobileuuid = window.localStorage.getItem('mobileuuid');
        app.mobiletoken = window.localStorage.getItem('mobiletoken');

    }

    var devicename = window.localStorage.getItem('devicename');

    app.devicename = devicename && devicename.length ? devicename : 'Octoblu Mobile';

    console.log('Set Owner UUID', JSON.stringify(app.skynetuuid));

    console.log('Set Data Creds', JSON.stringify([app.mobileuuid, app.mobiletoken]));

    if (!app.settings) app.settings = app.defaultSettings;

    app.settingsUpdated = false;

    app.sensorIntervals = {};

    app.socketid = null;

    return true;
};

app.logout = function () {

    window.loggedin = app.loggedin = false;
    window.localStorage.removeItem('loggedin');

    window.localStorage.removeItem('skynetactivity');

    window.localStorage.removeItem('plugins');

    window.localStorage.removeItem('subdevices');

    app.setData();

    function goToLogin(){
        window.location = 'http://localhost/index.html#!/login';
    }

    SkynetRest.logout()
        .then(function (data) {
            goToLogin();
        }, function(){
            console.log('Error Logging Out');
            goToLogin();
        });

    //window.open('http://app.octoblu.com/logout?js=1&referrer=' + encodeURIComponent('http://localhost/index.html#!/login'), '_self', 'location=yes');

};

app.login = function () {
    window.open('http://app.octoblu.com/login?mobile=true&referrer=' + encodeURIComponent('http://localhost/login.html'), '_self', 'location=yes');
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

        app.registerPushID().then(function () {
            console.log('Push ID Registered');
        }, function (err) {
            console.log(err);
        });

        app.conn.on('message', function (data) {
            var message;
            if (typeof data.payload !== 'string') {
                message = JSON.stringify(data.payload);
            } else {
                message = data.payload;
            }
            activity.logActivity({
                type: 'SkynetMessage',
                html: 'From: ' + data.fromUuid +
                    '<br>Message: ' + message
            });
        });

    }

    app.logSensorData();
    app.startBG();
};

app.regData = function () {
    var regData = {
        'name': app.devicename,
        'owner': app.skynetuuid,
        'type': 'octobluMobile',
        'online': true
    };

    if (app.mobileuuid && app.mobiletoken) {
        regData.uuid = app.mobileuuid;
        regData.token = app.mobiletoken;
    }

    if (app.pushID) regData.pushID = app.pushID;

    return regData;
};

// Register New Device
app.registerDevice = function (newDevice) {

    console.log('Registering...');

    var deferred = Q.defer();

    var regData = app.regData();

    if (newDevice) {
        delete regData.uuid;
        delete regData.token;
    }

    console.log('Registration Data: ', JSON.stringify(regData));

    app.conn.register(
        regData,
        function (data) {
            app.conn.identify();
            console.log('Registration Response: ', JSON.stringify(data));
            window.localStorage.setItem('mobileuuid', data.uuid);
            window.localStorage.setItem('mobiletoken', data.token);
            window.localStorage.setItem('devicename', data.name);

            app.mobileuuid = data.uuid;
            app.mobiletoken = data.token;
            app.devicename = data.name;

            deferred.resolve();
        });
    return deferred.promise;
}

app.register = function (registered) {


    var deferred = Q.defer();

    if (registered) {

        console.log('Updating');

        // Already Registered & Update the device
        app.updateDeviceSetting({})
            .done(deferred.resolve, deferred.resolve);

    } else {

        // Register new Device
        app.registerDevice()
            .done(deferred.resolve, deferred.reject);

    }

    return deferred.promise;

};

app.skynet = function () {
    var deferred = Q.defer();

    var conn = skynet.createConnection({
        uuid: app.mobileuuid,
        token: app.mobiletoken
    });

    conn.on('ready', function (data) {
        app.conn = conn;
        console.log(data);

        app.socketid = data.socketid;

        window.localStorage.setItem('mobileuuid', data.uuid);
        window.localStorage.setItem('mobiletoken', data.token);

        app.mobileuuid = data.uuid;
        app.mobiletoken = data.token;

        console.log('Connected to skynet');
        deferred.resolve();
    });

    conn.on('notReady', function (error) {
        console.log('Skynet Error during connect');
        app.conn = conn;
        deferred.reject(error);
    });

    return deferred.promise;
}

app.connect = function () {

    console.log('Connecting to skynet...');

    var deferred = Q.defer();

    if (app.conn) {
        console.log('Socket already established.');
        deferred.resolve();
    } else {

        app.skynet()
            .then(function () {
                console.log('Connected');
                app.updateDeviceSetting({}).then(deferred.resolve, deferred.reject);
            }, function (e, conn) {
                if (e) {
                    console.log(e.toString());
                }
                app.registerDevice(true, conn)
                    .done(deferred.resolve, deferred.reject);
            });
    }

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
                        app.conn.data({
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
    if(!data) data = {};
    var deferred = Q.defer();
    // Extend the data option
    data.uuid = app.mobileuuid;
    data.token = app.mobiletoken;
    data.online = true;
    data.owner = app.skynetuuid;
    data.pushID = app.pushID;
    data.platform = device.platform;
    data.name = app.devicename = data.name || app.devicename;

    window.localStorage.setItem('devicename', data.name);

    data.type = 'octobluMobile';

    if (data.setting) app.settings = data.setting;

    app.devicename = data.name;
    console.log('Updating Device');
    app.conn.update(data, function(){
        console.log('Device Updated');
        deferred.resolve();
    });

    return deferred.promise;
};

app.message = function (data) {
    var deferred = Q.defer();
    if (!data.uuid) data.uuid = app.mobileuuid;
    if (!data.token) data.token = app.mobiletoken;

    app.conn.message(data, function (d) {
        activity.logActivity({
            type: 'SentMessage',
            html: 'Sending Message: ' + JSON.stringify(data.payload)
        });
        deferred.resolve(d);
    });

    return deferred.promise;
};

app.triggerTopic = function(name, payload){
    var deferred = Q.defer();

    app.message({
        topic : name,
        payload : payload,
        uuid : app.skynetuuid,
        token : app.skynettoken
    }).then(deferred.resolve,
        deferred.reject);

    return deferred.promise;
};

app.whoami = function (uuid, token) {
    var deferred = Q.defer();

    app.conn.whoami({
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
        }, function (err) {
            console.log(err);
            deferred.reject('Unable to Retrieve Device');
        });
    return deferred.promise;
};

app.init = function () {
    var deferred = Q.defer();

    if(!app.setData()) {
        deferred.resolve();
    }

    activity.init();

    if (!app.isAuthenticated()) {
        deferred.resolve();
    } else {
        app.connect()
            .then(function () {
                app.startProcesses();
                console.log('Connected');
                $(document).trigger('skynet-loaded');
                deferred.resolve();

            }, deferred.reject);
    }

    return deferred.promise;
};

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
    triggerTopic: app.triggerTopic,
    getCurrentSettings: function () {
        return {
            conn: app.conn,
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