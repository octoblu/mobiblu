!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.Skynet=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
'use strict';

var Labels = _dereq_('./labels.js');

var obj = {};

var limit = 100;

obj.getActivity = function(type, limit){

    var activity = [];
    try{
        activity = JSON.parse(window.localStorage.getItem('skynetactivity'));
    }catch(e){

    }

    if(!activity){
        return [];
    }

    if(type){
        activity = _.filter(activity, { type : type });
    }
    if(limit){
        activity = activity.slice(0, limit);
    }
    //console.log('Activity', JSON.stringify(activity));
    return activity;

};

obj.clearActivityCount = function(){
    obj.x = 0;
    obj.sensActBadge.text(obj.x.toString());
    obj.sensActBadge.removeClass('badge-negative');
    window.localStorage.setItem('activitycount', obj.x);
};

obj.logActivity = function(data){
    Labels.getLabel(data.type)
        .then(function(type){
            data.type = type;

            if( !obj.skynetActivity ||
                !_.isArray(obj.skynetActivity) )
                obj.skynetActivity = [];
            obj.skynetActivity = obj.skynetActivity.slice(0, limit);

            data = _.extend({
                date : new Date()
            }, data);

            if(obj.skynetActivity.length)
                obj.skynetActivity.unshift(data);
            else
                obj.skynetActivity.push(data);

            if(data.error){
                obj.sensActBadge.text('Error');
                obj.sensActBadge.addClass('badge-negative');
            }else{
                obj.x++;
                obj.sensActBadge.text(obj.x.toString() + ' New');
                obj.sensActBadge.removeClass('badge-negative');
            }

            var string = JSON.stringify(obj.skynetActivity);

            window.localStorage.setItem('skynetactivity', string);
            window.localStorage.setItem('activitycount', obj.x);
            $(document).trigger('skynetactivity', data);

        });
};

obj.init = function(){

    obj.sensActBadge = $('#sensor-activity-badge'),
        obj.x = window.localStorage.getItem('activitycount') || 0;
    obj.skynetActivity = obj.getActivity();

};



module.exports = obj;
},{"./labels.js":3}],2:[function(_dereq_,module,exports){
'use strict';

var Sensors = _dereq_('./sensors.js');
var SkynetRest = _dereq_('./skynet.js');
var Topics = _dereq_('./topics.js');
var Labels = _dereq_('./labels.js');
var activity = _dereq_('./activity.js');

var Q = Promise;

var defer = function () {
    var resolve, reject;
    var promise = new Promise(function () {
        resolve = arguments[0];
        reject = arguments[1];
    });
    return {
        resolve: resolve,
        reject: reject,
        promise: promise
    };
};

var app = {};

app.loaded = false;

app.defaultSettings = {
    compass: false,
    accelerometer: false,
    geolocation: false,
    update_interval: 3,
    bg_updates: false,
    developer_mode: false
};

app.bgRunning = false;

app.conn = null;

app.setData = function (skynetuuid, skynettoken) {
    if (!skynetuuid) skynetuuid = window.localStorage.getItem('skynetuuid');
    if (!skynettoken) skynettoken = window.localStorage.getItem('skynettoken');

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

    console.log('Set Owner UUID : ' + JSON.stringify(app.skynetuuid));

    console.log('Set Data Creds : ' + JSON.stringify([app.mobileuuid, app.mobiletoken]));

    if (!app.settings || !app.settings.length) app.settings = app.defaultSettings;

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
    var deferred = defer();

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
    var deferred = defer();

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

        console.log('On Message: ' + message);

        activity.logActivity({
            type: 'message',
            html: 'From: ' + data.fromUuid +
                '<br>Message: ' + message
        });
    });

    app.logSensorData();
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

    var deferred = defer();

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

    var deferred = defer();

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

app.skynet = function (callback, errorCallback) {

    console.log('Connecting Creds: ' + JSON.stringify([app.mobileuuid, app.mobiletoken]));

    var config = {};
    if (app.mobileuuid && app.mobiletoken) {
        config = {
            uuid: app.mobileuuid,
            token: app.mobiletoken,
            protocol: 'websocket'
        };
    }

    var conn = skynet.createConnection(config);

    conn.on('ready', function (data) {

        app.conn = conn;

        console.log('Connected data: ' + JSON.stringify(data));

        app.socketid = data.socketid;

        window.localStorage.setItem('mobileuuid', data.uuid);
        window.localStorage.setItem('mobiletoken', data.token);

        app.mobileuuid = data.uuid;
        app.mobiletoken = data.token;

        console.log('Connected to skynet');
        callback(data);
    });

    conn.on('notReady', function (error) {
        console.log('Skynet notReady during connect');
        app.conn = conn;
        errorCallback(error, conn);
    });

    conn.on('error', function (error) {
        console.log('Skynet Error during connect');
        errorCallback(error);
    });
};

app.connect = function () {

    console.log('Connecting to skynet...');

    var deferred = defer();

    function connected() {
        console.log('Connected');
        app.updateDeviceSetting({});
        deferred.resolve();
    }

    function notConnected(e, conn) {
        if (e) {
            console.log('Error Connecting to Skynet: ' + e.toString());
        }
        if (conn) {
            app.registerDevice(true, conn)
                .done(deferred.resolve, deferred.reject);
        } else {
            deferred.reject(e);
        }
    }

    app.skynet(connected, notConnected);

    return deferred.promise;
};

app.logSensorData = function () {
    var sensors = [];

    // Clear Session Timeouts
    if (app.sensorIntervals) {
        console.log('Clearing Sensors');
        _.each(_.keys(app.sensorIntervals), function (key) {
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

app.getBGPlugin = function () {
    app.bgGeo = window.plugins ? window.plugins.backgroundGeoLocation : null;

    if (!app.bgGeo) {
        console.log('No BG Plugin');
        return false;
    }

    return true;
};

app.startBG = function () {
    if (!app.getBGPlugin()) return;
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
                uuid: app.mobileuuid,
                token: app.mobiletoken,
                type: 'octobluMobile'
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

app.stopBG = function () {
    var type = 'Background Geolocation';

    if (!app.getBGPlugin()) return;

    console.log('Stopping BG Location');

    app.bgGeo.stop();

    if (app.bgRunning) {
        activity.logActivity({
            type: type,
            html: 'Stopped Background Location'
        });
    }

    app.bgRunning = false;
};

app.updateDeviceSetting = function (data) {
    if (!data) data = {};
    var deferred = defer();
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

    if (app.bgRunning && !app.settings.bg_updates) {
        app.stopBG();
    } else if (!app.bgRunning) {
        app.startBG();
    }

    console.log('Updating Device');
    app.conn.update(data, function () {
        console.log('Device Updated');
        deferred.resolve();
    });

    return deferred.promise;
};

app.message = function (data) {
    var deferred = defer();
    if (!data.uuid) data.uuid = app.mobileuuid;
    if (!data.token) data.token = app.mobiletoken;
    var toStr = '';
    if(data.devices){
        toStr += '<br>' + 'To UUID: ';
        if(typeof data.devices === 'string'){
            toStr += data.devices;
        }else{
            toStr += JSON.stringify(data.devices);
        }
    }

    app.conn.message(data, function (d) {
        activity.logActivity({
            type: 'sent_message',
            html: 'Sending Message: ' + JSON.stringify(data.payload) + toStr
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

app.sendData = function (data) {
    var deferred = defer();

    var defaults = {
        'uuid': app.mobileuuid,
        'token': app.mobiletoken
    };
    data = _.extend(defaults, data);

    var eventName = 'sensor';
    if (data.sensorData && data.sensorData.type) {
        eventName += ':' + data.sensorData.type;
    } else if (data.device) {
        eventName += ':' + data.device;
    } else if (data.subdevice) {
        eventName += ':' + data.subdevice;
    } else if (data.name) {
        eventName += ':' + data.name;
    }

    $(document).trigger(eventName, data);

    app.conn.data(data, function () {
        deferred.resolve();
    });

    return deferred.promise;
}

app.triggerTopic = function (name, payload) {
    var deferred = defer();

    app.message({
        topic: name,
        payload: payload,
        devices: app.skynetuuid,
        uuid : app.skynetuuid,
        token : app.skynettoken
    }).then(deferred.resolve,
        deferred.reject);

    return deferred.promise;
};

app.whoami = function (uuid, token) {
    var deferred = defer();

    app.conn.whoami({
        uuid: uuid || app.mobileuuid,
        token: token || app.mobiletoken
    }, deferred.resolve);

    return deferred.promise;
};

app.getDeviceSetting = function (uuid, token) {
    var deferred = defer();

    if (app.settingsUpdated) {
        deferred.resolve({
            setting: app.settings
        });
    } else {
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
    var deferred = defer();

    app.setData(skynetuuid, skynettoken);

    activity.init();

    if (!app.isAuthenticated()) {
        console.log('Not Authenticated');
        deferred.resolve();
    } else {
        app.connect()
            .then(function () {

                console.log('Skynet Module Connected');

                app.startProcesses();
                $(document).trigger('skynet-loaded');

                deferred.resolve();

            }, function () {
                console.log('Unable to load the Skynet Module');
                deferred.reject();
            });
    }

    return deferred.promise;
};

var publicApi = {
    initilized: true,
    init: app.init,
    getDeviceSetting: app.getDeviceSetting,
    whoami: app.whoami,
    message: app.message,
    subscribe: app.subscribe,
    triggerTopic: app.triggerTopic,
    sendData: app.sendData,
    updateDeviceSetting: app.updateDeviceSetting,
    logout: app.logout,
    login: app.login,
    isAuthenticated: app.isAuthenticated,
    logSensorData: app.logSensorData,
    getCurrentSettings: function () {

        if (!app.skynetuuid) {
            app.setData();
        }

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
},{"./activity.js":1,"./labels.js":3,"./sensors.js":4,"./skynet.js":5,"./topics.js":6}],3:[function(_dereq_,module,exports){
var Q = Promise;

var defer = function () {
    var resolve, reject;
    var promise = new Promise(function () {
        resolve = arguments[0];
        reject = arguments[1];
    });
    return {
        resolve: resolve,
        reject: reject,
        promise: promise
    };
};

var self = {};

var loaded = false;

self.labels = {};

self.getLabels = function () {
    var deferred = defer();

    if (loaded) {
        deferred.resolve(self.labels);
    } else {
        $.getJSON('/data/labels.json')
            .success(function (data) {
                loaded = true;
                self.labels = data;
                deferred.resolve(data);
            })
            .error(deferred.reject);
    }

    return deferred.promise;
};

self.getLabel = function (lbl) {
    var deferred = defer();

    self.getLabels()
        .then(function () {
            var label = self.labels[lbl] || lbl;
            deferred.resolve(label);
        }, function(){
            deferred.resolve(lbl);
        });

    return deferred.promise;
};

module.exports = self;
},{}],4:[function(_dereq_,module,exports){
'use strict';

module.exports = {
    // Accelerometer apiect
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
                'Timestamp: ' + acceleration.timestamp + '<br>';
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
    // Compass apiect
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
            return 'Heading: ' + heading.magneticHeading + '<br />';
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

    // Geolocation apiect
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
                'Longitude: ' + position.coords.longitude + '<br />';
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
},{}],5:[function(_dereq_,module,exports){
'use strict';
var Q = Promise;

var defer = function () {
    var resolve, reject;
    var promise = new Promise(function () {
        resolve = arguments[0];
        reject = arguments[1];
    });
    return {
        resolve: resolve,
        reject: reject,
        promise: promise
    };
};


var baseURL = 'http://skynet.im';
var obj = {};

obj.getDevice = function (uuid, token) {
    var deferred = defer();

    if(!uuid && !token){
        deferred.resolve();
    }
    $.ajax({
        url: baseURL + '/devices/' + uuid,
        method: 'GET',
        headers: {
            skynet_auth_uuid: uuid,
            skynet_auth_token: token
        },
        timeout : 5 * 1000
    })
        .success(deferred.resolve)
        .error(deferred.reject);
    return deferred.promise;
};

obj.sendData = function (uuid, token, data) {
    var deferred = defer();
    $.ajax({
        url: baseURL + '/data/' + uuid,
        method: 'POST',
        params: data,
        headers: {
            skynet_auth_uuid: uuid,
            skynet_auth_token: token
        },
        timeout : 5 * 1000
    })
        .success(deferred.resolve)
        .error(deferred.reject);
    return deferred.promise;
};

obj.localdevices = function (settings) {
    var deferred = defer();
    $.ajax({
        url: baseURL + '/localdevices',
        method: 'GET',
        headers: {
            skynet_auth_uuid: settings.skynetuuid,
            skynet_auth_token: settings.skynettoken
        },
        timeout : 5 * 1000
    })
        .success(deferred.resolve)
        .error(deferred.reject);
    return deferred.promise;
};

obj.claimdevice = function (uuid, settings) {
    var deferred = defer();
    $.ajax({
        url: baseURL + '/claimdevice/' + uuid,
        method: 'PUT',
        headers: {
            skynet_auth_uuid: settings.skynetuuid,
            skynet_auth_token: settings.skynettoken
        },
        timeout : 5 * 1000
    })
        .success(deferred.resolve)
        .error(deferred.reject);
    return deferred.promise;
};

obj.logout = function (uuid, token) {
    var deferred = defer();
    $.ajax({
        url: 'https://app.octoblu.com/api/auth',
        method: 'DELETE',
        headers : {
            skynet_auth_uuid : uuid,
            skynet_auth_token : token
        },
        timeout : 5 * 1000
    })
        .success(deferred.resolve)
        .error(deferred.reject);
    return deferred.promise;
};



module.exports = obj;
},{}],6:[function(_dereq_,module,exports){
'use strict';

var lib = {},
    key = 'topics',
    defaultKey = 'default_topics',
    loadedDefaults = [],
    topics = [];

function write() {
    window.localStorage.setItem(key, JSON.stringify(topics));
}

function writeDefaults() {
    window.localStorage.setItem(defaultKey, JSON.stringify(loadedDefaults));
}

function getById(id) {
    var topic;
    try {
        topic = _.find(topics, { id: id });
    } catch (e) {

    }
    return topic;
}

function findIndex(id) {
    var index = -1;
    try {
        index = _.findIndex(topics, { id: id });
    } catch (e) {

    }
    return index;
}

var defaultTopics = [
    {
        id: 'a12319b-5d4f-ad87-a90a-198e92833335',
        name: 'Flow Preset A',
        wait: false,
        payload: ''
    },
    {
        id: 'a112di9b-5dsf-ad82-a90a-198e928123335',
        name: 'Flow Preset B',
        wait: false,
        payload: ''
    }
];

lib.getLoadedDefaultTopics = function () {
    var str = window.localStorage.getItem(defaultKey), obj = [];

    try {
        obj = JSON.parse(str);
    } catch (e) {
        console.log('Error parsing topics', e);
    }

    return loadedDefaults = obj || [];
};

lib.saveDefaultTopic = function (topic) {

    if ((topic && topic.length)) return false;

    if (!topic.id) topic.id = createID();

    delete topic.sent;

    var index = _.findIndex(loadedDefaults, { id: topic.id });

    if (!~index) {
        loadedDefaults.push(topic);
    } else {
        loadedDefaults[index] = topic;
    }

    writeDefaults();

    return topic;
};

lib.getAll = function () {

    if (!loadedDefaults.length) lib.getLoadedDefaultTopics();

    _.each(defaultTopics, function (topic) {
        var index = _.findIndex(loadedDefaults, { id: topic.id });
        if (!~index) {
            lib.saveDefaultTopic(topic);
            lib.save(topic);
        }
    });

    var str = window.localStorage.getItem(key), obj = [];

    try {
        obj = JSON.parse(str);
    } catch (e) {
        console.log('Error parsing topics', e);
    }

    topics = obj || [];

    if (topics && topics.length) {
        _.remove(topics, function (t) {
            return !t;
        });
        topics = _.sortBy(topics, 'name');
    }

    return topics;

};

lib.get = function (id) {

    if (!topics || !topics.length) lib.getAll();

    //console.log('Topics', JSON.stringify(topics), JSON.stringify(id));

    return getById(id);

};

lib.save = function (topic) {
    if ((topic && topic.length)) return false;

    if (!topic.id) topic.id = createID();

    delete topic.sent;

    var index = findIndex(topic.id);

    if (!~index) {
        topics.push(topic);
    } else {
        topics[index] = topic;
    }

    write();

    return topic;

};

lib.delete = function (topic) {
    _.remove(topics, { id: topic.id });

    write();
};

module.exports = lib;
},{}]},{},[2])
(2)
});