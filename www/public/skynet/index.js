'use strict';

var Sensors = require('./sensors.js');
var SkynetRest = require('./skynet.js');
var Topics = require('./topics.js');
var Labels = require('./labels.js');
var activity = require('./activity.js');
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

app.bgRunning = false;

app.conn = null;

app.setData = function (skynetuuid, skynettoken) {
    if(!skynetuuid) skynetuuid = window.localStorage.getItem('skynetuuid');
    if(!skynettoken) skynettoken = window.localStorage.getItem('skynettoken');

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

    if (!app.settings ||
        !app.settings.length) app.settings = app.defaultSettings;

    app.settingsUpdated = false;

    app.sensorIntervals = {};

    app.socketid = null;

    return true;
};

app.login = function (uuid, token) {
    app.setData(uuid, token);
    app.loggedin = true;
};

app.logout = function () {

    window.loggedin = app.loggedin = false;

    window.localStorage.removeItem('loggedin');

    window.localStorage.removeItem('skynetactivity');

    window.localStorage.removeItem('plugins');

    window.localStorage.removeItem('subdevices');

    app.setData();
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
                            type: 'push',
                            html: notification.message
                        });
                    });

                app.updateDeviceSetting({})
                    .then(function () {
                        activity.logActivity({
                            type: 'push',
                            html: 'Push ID Registered'
                        });
                        deferred.resolve();
                    }, function () {
                        activity.logActivity({
                            type: 'push',
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
                type: 'message',
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

    // Clear Session Timeouts
    if (app.sensorIntervals) {
        console.log('Clearing Sensors');
        _.each(_.keys(app.sensorIntervals), function(key){
            clearInterval(app.sensorIntervals[key]);
        });
    }

    var startSensor = function (sensor, type) {
        var sent = false;
        sensor.start(
            // Handle Success
            function (sensorData) {
                // Make sure it hasn't already been sent
                if (sent) return;
                sent = true;

                // Emit data
                app.sendData({
                    'sensorData': {
                        'type': type,
                        'data': sensorData
                    }
                }).then(function () {
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

    app.getDeviceSetting()
        .then(function () {
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

            sensors.forEach(function (sensorType) {

                if (sensorType && typeof Sensors[sensorType] === 'function') {

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

app.getBGPlugin = function(){
    app.bgGeo = window.plugins ? window.plugins.backgroundGeoLocation : null;

    if (!app.bgGeo) {
        console.log('No BG Plugin');
        return false;
    }

    return true;
};

app.startBG = function () {
    if(!app.getBGPlugin()) return;
    console.log('Started BG Location');

    if (!app.settings.bg_updates) app.stopBG();

    var type = 'Background Geolocation';

    // If BG Updates is turned off
    Sensors.Geolocation(1000).start(function () {
        // Send POST to SkyNet
        var sendToSkynet = function (response) {


            app.sendData({
                'sensorData': {
                    'type': type,
                    'data': response
                }
            }).then(function () {

                activity.logActivity({
                    type: type,
                    html: 'Successfully updated background location'
                });

                app.bgGeo.finish();

            }, app.bgGeo.finish);

        };

        var callbackFn = function (location) {
            sendToSkynet(location);
        };

        var failureFn = function (err) {
            activity.logActivity({
                type: type,
                error: err
            });
        };

        // BackgroundGeoLocation is highly configurable.
        app.bgGeo.configure(callbackFn, failureFn, {
            url: 'http://skynet.im/data/' + app.mobileuuid, // <-- only required for Android; ios allows javascript callbacks for your http
            params: { // HTTP POST params sent to your server when persisting locations.
                uuid : app.mobileuuid,
                token : app.mobiletoken,
                type : 'octobluMobile'
            },
            headers: {
                skynet_auth_uuid: app.mobileuuid,
                skynet_auth_token: app.mobiletoken
            },
            desiredAccuracy: 10,
            stationaryRadius: 20,
            distanceFilter: 30,
            debug: false // <-- enable this hear sounds for background-geolocation life-cycle.
        });

        app.bgRunning = true;

        app.bgGeo.start();

    }, function (err) {
        console.log('Error', err);
    });

};

app.stopBG = function(){
    var type = 'Background Geolocation';

    if(!app.getBGPlugin()) return;

    console.log('Stopping BG Location');

    app.bgGeo.stop();

    activity.logActivity({
        type: type,
        html: 'Stopped Background Location'
    });

    app.bgRunning = false;
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
    data.platform = window.device.platform;
    data.name = app.devicename = data.name || app.devicename;

    window.localStorage.setItem('devicename', data.name);

    data.type = 'octobluMobile';

    if (data.setting) app.settings = data.setting;

    if(app.bgRunning && !app.settings.bg_updates){
        app.stopBG();
    }else if(!app.bgRunning){
        app.startBG();
    }

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
            type: 'sent_message',
            html: 'Sending Message: ' + JSON.stringify(data.payload)
        });
        deferred.resolve(d);
    });

    return deferred.promise;
};


app.subscribe = function (data, fn) {
    if (!data.uuid) data.uuid = app.mobileuuid;
    if (!data.token) data.token = app.mobiletoken;

    app.conn.subscribe(data, fn);
};

app.sendData = function(data){
    var deferred = Q.defer();

    var defaults = {
        'uuid': app.mobileuuid,
        'token': app.mobiletoken
    };
    data = _.extend(defaults, data);

    app.conn.data(data, function(){
        deferred.resolve();
    });

    return deferred.promise;
}

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
        deferred.resolve({
            setting: app.settings
        });
    }else{
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
    }

    return deferred.promise;
};

app.init = function (skynetuuid, skynettoken) {
    console.log('Init');
    var deferred = Q.defer();

    app.setData(skynetuuid, skynettoken);

    activity.init();

    if (!app.isAuthenticated()) {
        console.log('Not Authenticated');
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
    subscribe : app.subscribe,
    triggerTopic: app.triggerTopic,
    sendData: app.sendData,
    updateDeviceSetting: app.updateDeviceSetting,
    logout: app.logout,
    login: app.login,
    isAuthenticated: app.isAuthenticated,
    logSensorData: app.logSensorData,
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
    Labels: Labels,
    SkynetRest: SkynetRest,
    Topics: Topics,
    clearActivityCount: activity.clearActivityCount,
    getActivity: activity.getActivity,
    logActivity: activity.logActivity
};


module.exports = publicApi;