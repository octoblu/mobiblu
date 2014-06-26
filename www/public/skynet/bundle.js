!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.Skynet=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
'use strict';

var obj = {};

obj.getActivity = function(){
    var activity = [];
    try{
        activity = JSON.parse(window.localStorage.getItem('skynetactivity'));
    }catch(e){

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
    if( !obj.skynetActivity ||
        !_.isArray(obj.skynetActivity) )
        obj.skynetActivity = [];
    obj.skynetActivity = obj.skynetActivity.slice(0, 50);

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
    $(document).trigger('skynetactivity', true);
};

obj.init = function(){
    obj.sensActBadge = $('#sensor-activity-badge'),
        obj.x = window.localStorage.getItem('activitycount') || 0;
    obj.skynetActivity = obj.getActivity();
};



module.exports = obj;
},{}],2:[function(_dereq_,module,exports){
'use strict';

var Sensors = _dereq_('./sensors.js');
var activity = _dereq_('./activity.js');
var SkynetRest = _dereq_('./skynet.js');

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
    app.loggedin = !! window.localStorage.getItem('loggedin');
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

app.isRegistered = function (callback) {
    app.whoami(null, null, function (data) {
        if (data.uuid === app.mobileuuid) {
            callback(true);
        } else {
            callback(false);
        }
    });
};

app.isRegisteredOld = function () {
    return !!(app.mobileuuid && app.mobiletoken);
};

app.startProcesses = function () {

    if(!app.loaded){

        app.loaded = true;

        document.addEventListener('urbanairship.registration', function (event) {
            if (event.error) {
                console.log('Urbanairship Registration Error');
            } else {
                app.pushID = event.pushID;
                window.localStorage.setItem('pushID', app.pushID);

                steroids.addons.urbanairship
                    .notifications.onValue(function(notification) {
                        activity.logActivity({
                            type : 'PushNotification',
                            html : notification.message
                        });
                    });

                app.updateDeviceSetting({}, function () {});
            }
        }, false);

        app.skynetSocket.on('message', function (data) {
            activity.logActivity({
                type : 'SkynetMessage',
                html : 'From: ' + data.fromUuid +
                    '<br>Message: ' + data.payload
            });
        });

        $(document).trigger('skynet-loaded');

    }

    app.logSensorData();
    app.startBG();
};

app.register = function (callback) {
    app.isRegistered(function (registered) {
        if (registered) {

            // Already Registered & Update the device
            app.updateDeviceSetting({
                'type': 'octobluMobile'
            }, function (data) {
                callback(data);
                app.startProcesses();
            });

        } else {
            var regData = {
                'name': app.devicename,
                'owner': app.skynetuuid,
                'type': 'octobluMobile',
                'online': true
            };

            if(app.pushID) regData.pushID = app.pushID;

            app.skynetSocket.emit('register', regData, function (data) {

                data.mobileuuid = data.uuid;
                data.mobiletoken = data.token;

                app.mobileuuid = data.mobileuuid;
                app.mobiletoken = data.mobiletoken;

                window.localStorage.setItem('mobileuuid', data.uuid);
                window.localStorage.setItem('mobiletoken', data.token);
                window.localStorage.setItem('devicename', data.name);

                callback(data);
                app.startProcesses();
            });
        }
    });

};

app.auth = function (callback) {
    if (app.skynetSocket) {
        return app.getDeviceSetting(null, null, callback);
    }
    // GETS HERE
    var data = {
        'uuid': app.mobileuuid || app.skynetuuid,
        'token': app.mobiletoken || app.skynettoken
    };
    app.skynetClient = skynet(data, function (e, socket) {
        console.log('here', JSON.stringify(data));
        if (e) {
            console.log(e.toString());
            activity.logActivity({
                type : 'Skynet',
                error : e
            });
            callback();
        } else {
            app.skynetSocket = socket;
            app.register(callback);
        }
    });
};



app.logSensorData = function () {
    var sensors = [];

    app.getDeviceSetting(null, null, function () {
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
                        'uuid' : app.mobileuuid,
                        'token' : app.mobiletoken,
                        'sensorData' : {
                            'type' : type,
                            'data' : sensorData
                        }
                    }, function () {
                        activity.logActivity({
                            type : type,
                            data : sensorData,
                            html : sensor.prettify(sensorData)
                        });
                    });

                },
                // Handle Errors
                function (err) {
                    activity.logActivity({
                        type : type,
                        error : err
                    });
                }
            );
        };

        sensors.forEach(function (sensorType) {
            if (sensorType && typeof Sensors[sensorType] === 'function') {
                if(app.sensorIntervals[sensorType]) {
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
                    type : 'BG_Geolocation',
                    html : 'Successfully updated background location'
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
                type : 'BG_Geolocation',
                error : err
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

app.updateDeviceSetting = function (data, callback) {
    // Extend the data option
    data.uuid = app.mobileuuid;
    data.token = app.mobiletoken;
    data.online = true;
    data.owner = app.skynetuuid;
    data.pushID = app.pushID;
    data.name = data.name || app.devicename;
    app.type = 'octobluMobile';

    if(data.setting) app.settings = data.setting;

    app.devicename = data.name;

    app.skynetSocket.emit('update', data, function(res){
        // activity.logActivity({
        //     type : 'UpdateDevice',
        //     html : 'Successfully updated device'
        // });
        callback(res);
    });
};

app.message = function (data, callback) {
    if(!data.uuid) data.uuid = app.mobileuuid;
    if(!data.token) data.token = app.mobiletoken;

    app.skynetSocket.emit('message', data, function(d){
        activity.logActivity({
            type : 'SentMessage',
            html : 'Sending Message: ' + JSON.stringify(data.payload)
        });
        callback(d);
    });
};

app.whoami = function (uuid, token, callback) {
    app.skynetSocket.emit('whoami', {
        uuid: uuid || app.mobileuuid,
        token: token || app.mobiletoken
    }, callback);
};

app.getDeviceSetting = function (uuid, token, callback) {
    if(app.settingsUpdated){
        return callback({
            setting : app.settings
        });
    }
    SkynetRest.getDevice(uuid || app.mobileuuid,
            token || app.mobiletoken,
        function (err, data) {
            var device;

            if(!data) return callback();

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

            callback(device);
        });
};

app.init = function (callback) {
    app.setData();

    activity.init();

    if (app.isAuthenticated()) {
        app.auth(callback);
    } else {
        callback();
    }
};

var publicApi = {
    initilized : true,
    init : app.init,
    getDeviceSetting : app.getDeviceSetting,
    whoami : app.whoami,
    message : app.message,
    updateDeviceSetting : app.updateDeviceSetting,
    logout : app.logout,
    login : app.login,
    isAuthenticated : app.isAuthenticated,
    logSensorData : app.logSensorData,
    getCurrentSettings : function(){
        return {
            skynetSocket : app.skynetSocket,
            devicename : app.devicename,
            loggedin : app.loggedin,
            mobileuuid : app.mobileuuid,
            mobiletoken : app.mobiletoken,
            skynetuuid : app.skynetuuid,
            skynettoken : app.skynettoken,
            settings : app.settings
        };
    },
    Sensors : Sensors,
    clearActivityCount : activity.clearActivityCount,
    getActivity : activity.getActivity,
    logActivity : activity.logActivity
};


module.exports = publicApi;
},{"./activity.js":1,"./sensors.js":3,"./skynet.js":4}],3:[function(_dereq_,module,exports){
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
},{}],4:[function(_dereq_,module,exports){
'use strict';

var baseURL = 'http://skynet.im';
var obj = {};

obj.getDevice = function (uuid, token, callback) {
    $.ajax({
        url: baseURL + '/devices/' + uuid,
        method: 'GET',
        headers: {
            skynet_auth_uuid: uuid,
            skynet_auth_token: token
        },
        timeout : 5 * 1000
    })
        .success(function (data) {
            callback(null, data);
        })
        .error(function (data, status, headers, config) {
            console.log('Error: ', data, status, headers, config);
            callback(data);
        });
};

obj.sendData = function (uuid, token, data, callback) {
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
        .success(function (data) {
            callback(null, data);
        })
        .error(function (data, status, headers, config) {
            console.log('Error: ', data, status, headers, config);
            callback(data);
        });
};

module.exports = obj;
},{}]},{},[2])
(2)
});