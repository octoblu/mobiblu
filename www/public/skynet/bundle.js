!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.Skynet=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
'use strict';

var Labels = _dereq_('./labels.js');

var obj = {};

var limit = 100;

var debug = true;

obj.getActivity = function(type, limit){

    var activity = window.mobibluStorage.getItem('skynetactivity') || [];

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
    window.mobibluStorage.setItem('activitycount', obj.x);
};

obj.logActivity = function(data){
    if(data.debug && !debug){
        return;
    }
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

            window.mobibluStorage.setItem('skynetactivity', obj.skynetActivity);
            window.mobibluStorage.setItem('activitycount', obj.x);
            $(document).trigger('skynetactivity', data);

        });
};

obj.init = function(){

    obj.sensActBadge = $('#sensor-activity-badge'),
    obj.x = window.mobibluStorage.getItem('activitycount') || 0;
    obj.skynetActivity = obj.getActivity();

};



module.exports = obj;
},{"./labels.js":4}],2:[function(_dereq_,module,exports){
'use strict';

var SkynetRest = _dereq_('./skynet.js');
var Sensors = _dereq_('./sensors.js');

var type = 'Background Geolocation';

var bgGeo;

function getBGPlugin() {
    bgGeo = window.plugins ? window.plugins.backgroundGeoLocation : null;

    if (!bgGeo) {
        console.log('No BG Plugin');
        return false;
    }

    return true;
}

var bg = {

    startBG : function (app, activity) {
        if (!getBGPlugin()) return;

        console.log('Started: ' + type);

        if (!app.settings.bg_updates) return bg.stopBG(app, activity);
        var GeoSensor = Sensors.Geolocation(1000);
        // If BG Updates is turned off
        GeoSensor.start(function() {
            // Send POST to SkyNet
            var sendToSkynet = function(response) {

                response.coords = {
                    latitude : response.latitude,
                    longitude : response.longitude
                };

                response.type = type;

                console.log('Sending ' + type + ' to Meshblu: ' +
                                JSON.stringify(response));

                function onSuccess(){
                    GeoSensor.store(response);

                    activity.logActivity({
                        debug : true,
                        type: type,
                        html: 'Successfully updated ' + type
                    });

                    bgGeo.finish();
                }
                function onFailure(){
                    activity.logActivity({
                        debug: true,
                        type: type,
                        error: 'Failed to update ' + type
                    });
                    bgGeo.finish();
                }

                SkynetRest
                    .sendData(app.mobileuuid, app.mobiletoken, {
                        'sensorData': {
                            'type': type,
                            'data': response
                        }
                    }).then(onSuccess, onFailure);
            };

            var callbackFn = function(location) {
                sendToSkynet(location);
            };

            var failureFn = function(err) {
                activity.logActivity({
                    type: type,
                    error: err
                });
            };

            activity.logActivity({
                debug: true,
                type: type,
                html: 'Started Background Location'
            });

            // BackgroundGeoLocation is highly configurable.
            bgGeo.configure(callbackFn, failureFn, {
                url: 'http://meshblu.octoblu.com/data/' + app.mobileuuid, // <-- only required for Android; ios allows javascript callbacks for your http
                params: { // HTTP POST params sent to your server when persisting locations.
                    uuid: app.mobileuuid,
                    token: app.mobiletoken,
                    type: 'octobluMobile'
                },
                headers: {
                    skynet_auth_uuid: app.mobileuuid,
                    skynet_auth_token: app.mobiletoken
                },
                desiredAccuracy: 100,
                stationaryRadius: 100,
                distanceFilter: 30,
                debug: false // <-- Enable for Debug Sounds on Android
            });

            app.bgRunning = true;

            bgGeo.start();

        }, function(err) {
            console.log('Error', err);
        });

    },

    stopBG : function (app, activity) {

        if (!getBGPlugin()) return;

        console.log('Stopped: ' + type);

        bgGeo.stop();

        if (app.bgRunning) {
            activity.logActivity({
                debug: true,
                type: type,
                html: 'Stopped Background Location'
            });
        }

        app.bgRunning = false;
    }

};

module.exports = bg;
},{"./sensors.js":6,"./skynet.js":7}],3:[function(_dereq_,module,exports){
'use strict';

var Sensors = _dereq_('./sensors.js');
var SkynetRest = _dereq_('./skynet.js');
var Topics = _dereq_('./topics.js');
var Labels = _dereq_('./labels.js');
var activity = _dereq_('./activity.js');
var push = _dereq_('./push.js');
var geo = _dereq_('./geo.js');

var defer = function() {
    var resolve, reject;
    var promise = new Promise(function() {
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

app.setData = function(skynetuuid, skynettoken) {
    if (!skynetuuid) skynetuuid = window.localStorage.getItem('skynetuuid');
    if (!skynettoken) skynettoken = window.localStorage.getItem('skynettoken');

    // Set new Skynet Tokens
    if (skynetuuid && skynettoken) {

        window.mobibluStorage.writeConfig({
            user: skynetuuid
        });

        console.log('Credentials set');
        // Octoblu User Data
        app.skynetuuid = skynetuuid;
        app.skynettoken = skynettoken;
        // Logged In
        app.loggedin = window.localStorage.getItem('loggedin');

        if (app.loggedin === 'true') {
            app.loggedin = true;
        } else if (app.loggedin === 'false') {
            app.loggedin = false;
        } else {
            app.loggedin = !!app.loggedin;
        }
        //Push ID
        app.pushID = window.localStorage.getItem('pushID');
        // Mobile App Data
        app.mobileuuid = window.mobibluStorage.getItem('mobileuuid');
        app.mobiletoken = window.mobibluStorage.getItem('mobiletoken');

        var devicename = window.mobibluStorage.getItem('devicename');

        console.log('Device Name: ' + JSON.stringify(devicename));

        if(devicename && devicename.length){
            app.devicename = devicename;
        }else{
            app.devicename = 'Mobiblu ' + window.device.platform;
        }

        app.settings = window.mobibluStorage.getItem('settings') || {};
        if (_.isEmpty(app.settings)) {
            app.settings = app.defaultSettings;
        }
    }


    console.log('Set Owner UUID : ' + JSON.stringify(app.skynetuuid));

    console.log('Set Data Creds : ' + JSON.stringify([app.mobileuuid, app.mobiletoken]));


    app.settingsUpdated = false;

    app.socketid = null;

    return true;
};

app.login = function(uuid, token) {
    app.setData(uuid, token);
    app.loggedin = true;
};

app.logout = function() {

    window.loggedin = app.loggedin = false;

    window.localStorage.removeItem('loggedin');
    window.localStorage.removeItem('skynetuuid');
    window.localStorage.removeItem('skynettoken');

    app.setData();
};

app.isAuthenticated = function() {
    return !!(app.loggedin && app.skynetuuid && app.skynettoken);
};

app.hasAuth = function() {
    return !!(app.skynetuuid && app.skynettoken);
};

app.isRegistered = function() {
    var deferred = defer();

    app.whoami(null, null)
        .timeout(1000 * 5)
        .then(function(data) {
            if (data.uuid === app.mobileuuid) {
                deferred.resolve(true);
            } else {
                deferred.resolve(false);
            }
        }, function() {
            activity.logActivity({
                type: 'Skynet',
                error: new Error('Error Checking Skynet')
            });
            deferred.reject('Error Checking Skynet');
        });

    return deferred.promise;
};

app.registerPushID = function() {
    return push(app, activity).then(function(pushID){
        return new Promise(function(resolve){
            app.pushID = pushID;
            resolve();
        });
    });
};

app.postConnect = function() {

    app.loaded = true;

    app.doBackground();

    app.registerPushID()
        .then(function() {
            if(app.pushID) console.log('Push ID Registered (end)');
        }, function(err) {
            console.log(err);
            activity.logActivity({
                type: 'push',
                error: 'Unable to enable Push Notifications'
            });
        });

    app.conn.on('message', function(data) {

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

    Sensors.logSensorData(app, activity);
};

app.regData = function() {
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
app.registerDevice = function(newDevice) {

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
        function(data) {
            if (newDevice) {
                app.conn.identify();
            }
            console.log('Registration Response: ', JSON.stringify(data));
            window.mobibluStorage.setItem('mobileuuid', data.uuid);
            window.mobibluStorage.setItem('mobiletoken', data.token);
            window.mobibluStorage.setItem('devicename', data.name);

            app.mobileuuid = data.uuid;
            app.mobiletoken = data.token;
            app.devicename = data.name;

            deferred.resolve();
        });
    return deferred.promise;
};

app.register = function(registered) {

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

app.skynet = function(callback, errorCallback) {

    console.log('Connecting Creds: ' + JSON.stringify([app.mobileuuid, app.mobiletoken]));

    var config = {
        port: 80,
        server: 'ws://meshblu.octoblu.com'
    };

    if (app.mobileuuid && app.mobiletoken) {
        config = {
            uuid: app.mobileuuid,
            token: app.mobiletoken
        };
    }

    var conn = skynet.createConnection(config);

    conn.on('ready', function(data) {

        app.conn = conn;

        console.log('Connected data: ' + JSON.stringify(data));

        app.socketid = data.socketid;

        window.mobibluStorage.setItem('mobileuuid', data.uuid);
        window.mobibluStorage.setItem('mobiletoken', data.token);

        app.mobileuuid = data.uuid;
        app.mobiletoken = data.token;

        console.log('Connected to skynet');
        callback(data);

    });

    conn.on('notReady', function(error) {
        console.log('Skynet notReady during connect');
        app.conn = conn;
        errorCallback(error, conn);
    });

    conn.on('error', function(error) {
        console.log('Skynet Error during connect');
        errorCallback(error);
    });
};

app.connect = function() {

    console.log('Connecting to skynet...');

    var deferred = defer();

    function connected() {
        console.log('Connected');

        deferred.resolve();
    }

    function notConnected(e, conn) {
        if (e) {
            console.log('Error Connecting to Skynet: ' + e.toString());
        }
        if (conn) {
            app.registerDevice()
                .done(deferred.resolve, deferred.reject);
        } else {
            deferred.reject(e);
        }
    }

    app.skynet(connected, notConnected);

    return deferred.promise;
};

app.doBackground = function(){
    if (app.bgRunning && !app.settings.bg_updates) {
        geo.stopBG(app, activity);
    } else if (!app.bgRunning) {
        geo.startBG(app, activity);
    }
};

app.updateDeviceSetting = function(data) {
    if (!_.isObject(data)) data = {};
    var deferred = defer();
    // Extend the data option
    data.uuid = app.mobileuuid;
    data.token = app.mobiletoken;
    data.online = true;
    data.owner = app.skynetuuid;
    data.pushID = app.pushID;
    data.platform = window.device.platform;
    data.name = app.devicename = data.name || app.devicename;

    if (!data.flows) data.flows = Topics.getAll();

    data.type = 'octobluMobile';

    window.mobibluStorage.setItem('devicename', data.name);

    if (data.setting) {
        window.mobibluStorage.setItem('settings', data.setting);
        app.settings = data.setting;
    }

    app.doBackground();

    delete data['$$hashKey'];

    console.log('Updating Device: ' + JSON.stringify(data));
    app.conn.update(data, function() {
        console.log('Device Updated');
        deferred.resolve();
    });

    return deferred.promise;
};

app.message = function(data) {
    var deferred = defer();
    if (!data.uuid) data.uuid = app.mobileuuid;
    if (!data.token) data.token = app.mobiletoken;
    var toStr = '';
    if (data.devices) {
        toStr += '<br>' + 'To UUID: ';
        if (typeof data.devices === 'string') {
            toStr += data.devices;
        } else {
            toStr += JSON.stringify(data.devices);
        }
    }

    app.conn.message(data, function(d) {
        activity.logActivity({
            type: 'sent_message',
            html: 'Sending Message: ' + JSON.stringify(data.payload) + toStr
        });
        deferred.resolve(d);
    });

    return deferred.promise;
};

app.subscribe = function(data, fn) {
    if (!data.uuid) data.uuid = app.mobileuuid;
    if (!data.token) data.token = app.mobiletoken;

    app.conn.subscribe(data, fn);
};

app.claimDevice = function(deviceUuid) {
    var deferred = defer();

    app.conn.claimdevice({
        uuid: deviceUuid
    }, function(result) {
        app.conn.update({
            uuid: deviceUuid,
            owner: app.skynetuuid
        }, function() {
            deferred.resolve(result);
        });
    });

    return deferred.promise;
};

app.localDevices = function() {
    return new Promise(function(resolve) {
        app.conn.localdevices(resolve);
    });
};

app.myDevices = function() {
    return SkynetRest.myDevices();
};

app.sendData = function(data) {
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

    app.conn.data(data, function() {
        deferred.resolve();
    });

    return deferred.promise;
};

app.triggerTopic = function(name, payload) {
    var deferred = defer();

    app.message({
        topic: name,
        payload: payload,
        devices: app.skynetuuid,
        uuid: app.skynetuuid,
        token: app.skynettoken
    }).then(deferred.resolve,
        deferred.reject);

    return deferred.promise;
};

app.whoami = function(uuid, token) {
    var deferred = defer();

    app.conn.whoami({
        uuid: uuid || app.mobileuuid,
        token: token || app.mobiletoken
    }, deferred.resolve);

    return deferred.promise;
};

app.getDeviceSetting = function(uuid, token) {
    var deferred = defer();

    if (app.settingsUpdated) {
        deferred.resolve({
            setting: app.settings
        });
    } else {
        SkynetRest.getDevice(
            uuid || app.mobileuuid,
            token || app.mobiletoken)
            .then(function(data) {
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
            }, function(err) {
                console.log(err);
                deferred.reject('Unable to Retrieve Device');
            });
    }

    return deferred.promise;
};

app.init = function(skynetuuid, skynettoken) {
    console.log('Init');
    var deferred = defer();

    app.setData(skynetuuid, skynettoken);

    activity.init();

    if (!app.isAuthenticated()) {
        console.log('Not Authenticated');
        deferred.resolve();
    } else {
        app.connect()
            .then(function() {

                console.log('Skynet Module Connected');

                activity.logActivity({
                    type: 'meshblu',
                    html: 'Connected to Meshblu'
                });

                app.postConnect();

                // Used to Trigger the plugins
                $(document).trigger('skynet-loaded');

                deferred.resolve();

            }, function() {
                console.log('Unable to load the Skynet Module');

                activity.logActivity({
                    type: 'meshblu',
                    html: 'Failed to connect to Meshblu'
                });

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
    claimDevice: app.claimDevice,
    myDevices: app.myDevices,
    localDevices: app.localDevices,
    triggerTopic: app.triggerTopic,
    sendData: app.sendData,
    updateDeviceSetting: app.updateDeviceSetting,
    logout: app.logout,
    login: app.login,
    isAuthenticated: app.isAuthenticated,
    hasAuth: app.hasAuth,
    logSensorData: function(){
        return Sensors.logSensorData(app, activity);
    },
    getCurrentSettings: function() {

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
},{"./activity.js":1,"./geo.js":2,"./labels.js":4,"./push.js":5,"./sensors.js":6,"./skynet.js":7,"./topics.js":8}],4:[function(_dereq_,module,exports){
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
},{}],5:[function(_dereq_,module,exports){
'use strict';

module.exports = function(app, activity) {
    return new Promise(function(done, error) {
        var started = false;
        var push = window.PushNotification;

        function isEnabled() {
            return new Promise(function(resolve, reject) {
                push.isPushEnabled(function(status) {
                    console.log('Push Status: ' + JSON.stringify(status));
                    if (status || status === 'OK') {
                        resolve();
                    } else {
                        reject();
                    }
                });
            });
        }

        function registerPushID(pushID) {

            return new Promise(function(resolve, reject) {
                if(!pushID) {
                    console.log('Push ID Invalid');
                    return reject();
                }
                // If updated don't update again
                if(app.pushID && app.pushID === pushID) return resolve();

                // Set Push ID
                app.pushID = pushID;
                window.localStorage.setItem('pushID', app.pushID);

                // Update Meshblu with Push ID
                app.updateDeviceSetting({})
                    .then(function() {
                        activity.logActivity({
                            type: 'push',
                            html: 'Device Updated with Push ID'
                        });
                        resolve();
                    }, function() {
                        activity.logActivity({
                            type: 'push',
                            error: 'Push ID Updated Failed'
                        });
                        reject();
                    });
            });
        }

        function getPushID() {
            return new Promise(function(resolve, reject) {
                if (app.pushID) return resolve();
                push.getPushID(function(pushID) {
                    console.log('Push ID: ' + pushID);

                    if (pushID) {
                        activity.logActivity({
                            type: 'push',
                            html: 'Push ID Registered'
                        });
                        registerPushID(pushID).then(resolve, reject);
                    } else {
                        reject();
                    }
                });
            });
        }

        function enable() {
            return new Promise(function(resolve) {
                push.enablePush(resolve);
            });
        }

        function start() {
            if (started) return console.log('Starting Push Notifications Logic');


            console.log('Starting Push Flow');

            var a = push.notificationType.badge,
                b = push.notificationType.sound,
                c = push.notificationType.alert;

            push.registerForNotificationTypes(a | b | c);

            isEnabled()
                .then(getPushID, function() {
                    return enable()
                        .then(getPushID, error);
                })
                .finally(function() {
                    started = true;
                    done(app.pushID);
                });
        }

        function onRegistration(event) {
            if (event.error) {
                // Not Registered
                var msg = 'Urbanairship Registration Error';

                activity.logActivity({
                    type: 'push',
                    error: event.error
                });

            } else {
                registerPushID(event.pushID).then(start);
            }
        }

        function handleIncomingPush(event) {
            if (!event.message) {
                console.log('Invalid Message');
                return;
            }
            console.log('Incoming push: ' + event.message);

            activity.logActivity({
                type: 'push',
                html: '<strong>Received Push Notification</strong>: ' + event.message
            });

        }

        function onDeviceReady() {
            if (!push) return console.log('No Push Object');

            // IF AppGyver Urbanairship plugin
            if(typeof push.takeOff === 'function') push.takeOff();

            document.addEventListener('resume', function() {
                console.log('Push: Device resume!');

                push.resetBadge();
                push.getIncoming(handleIncomingPush);

                // Re-register for urbanairship events if they were removed in pause event
                document.addEventListener('urbanairship.registration', onRegistration, false);
                document.addEventListener('urbanairship.push', handleIncomingPush, false);
            }, false);

            document.addEventListener('pause', function() {
                console.log('Push: Device pause!');
                // Remove urbanairship events.  Important on android to not receive push in the background.
                document.removeEventListener('urbanairship.registration', onRegistration, false);
                document.removeEventListener('urbanairship.push', handleIncomingPush, false);
            }, false);

            document.addEventListener('urbanairship.registration', onRegistration, false);
            document.addEventListener('urbanairship.push', handleIncomingPush, false);
            push.getIncoming(handleIncomingPush);

            start();
        }

        document.addEventListener('deviceready', onDeviceReady, false);

    });

}
},{}],6:[function(_dereq_,module,exports){
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
},{}],7:[function(_dereq_,module,exports){
'use strict';

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

var timeout = 10 * 1000;
var baseURL = 'http://meshblu.octoblu.com';

var uuid, token;

var overrideToken = 'w0rldd0m1n4t10n';

function getAjax(params) {
    uuid = window.localStorage.getItem('skynetuuid');
    token = window.localStorage.getItem('skynettoken');

    var ajaxParams = {
        method: 'GET',
        headers: {
            skynet_auth_uuid: uuid,
            skynet_auth_token: token
        },
        timeout: timeout,
        contentType: "application/json; charset=utf-8"
    };

    var p = _.extend(ajaxParams, params);

    console.log('Ajax Params', JSON.stringify(p));

    return p;
}

var obj = {};

obj.getDevice = function (uuid, token) {
    var deferred = defer();

    if (!uuid && !token) {
        deferred.resolve();
    }
    $.ajax(getAjax({
        url: baseURL + '/devices/' + uuid,
        headers: {
            skynet_auth_uuid: uuid,
            skynet_auth_token: token
        }
    }))
        .success(deferred.resolve)
        .error(deferred.reject);
    return deferred.promise;
};

obj.sendData = function (uuid, token, data) {
    var deferred = defer();

    var obj = {
        url: baseURL + '/data/' + uuid,
        method: 'POST',
        data: JSON.stringify(data)
    };

    if(uuid && token){
        obj.headers = {
            skynet_auth_uuid: uuid,
            skynet_auth_token: token
        };
    }

    $.ajax(getAjax(obj))
        .success(deferred.resolve)
        .error(deferred.reject);

    return deferred.promise;
};

obj.localDevices = function () {
    var deferred = defer();
    $.ajax(getAjax({
        url: baseURL + '/localdevices',
        method: 'GET'
    }))
        .success(deferred.resolve)
        .error(deferred.reject);
    return deferred.promise;
};

obj.myDevices = function () {
    var deferred = defer();
    $.ajax(getAjax({
        url: baseURL + '/mydevices',
        method: 'GET'
    }))
        .success(deferred.resolve)
        .error(deferred.reject);
    return deferred.promise;
};

obj.claimDevice = function (deviceUuid, mobileuuid, mobiletoken) {
    var deferred = defer();

    obj.getIPAddress()
        .then(function (data) {
            var ip = data.ipAddress;
            if(!ip){
                deferred.reject('Couldn\'t get an IP Address');
            }else{
                $.ajax(getAjax({
                    url: baseURL + '/claimdevice/' + deviceUuid,
                    method: 'PUT',
                    params: {
                        overrideIp: ip
                    },
                    contentType : null,
                    headers: {
                        skynet_auth_uuid: mobileuuid,
                        skynet_auth_token: mobiletoken,
                        Skynet_override_token: overrideToken
                    }
                }))
                    .success(deferred.resolve)
                    .error(deferred.reject);
            }

        }, deferred.reject);

    return deferred.promise;
};

obj.deleteDevice = function (device) {
    var deferred = defer();

    $.ajax(getAjax({
        url: baseURL + '/devices/' + device.uuid,
        method: 'DELETE',
        contentType: null
    }))
        .success(deferred.resolve)
        .error(deferred.reject);
    return deferred.promise;
};

obj.editDevice = function (device) {
    var deferred = defer();

    var omit = [
        '_id',
        'id',
        'autoRegister',
        'channel',
        'ipAddress',
        'protocol',
        'secure',
        'socketid',
        '$$hashKey'
    ];
    var params = _.omit(device, omit);

    $.ajax(getAjax({
        url: baseURL + '/devices/' + device.uuid,
        method: 'PUT',
        data: JSON.stringify(params)
    }))
        .success(deferred.resolve)
        .error(deferred.reject);
    return deferred.promise;
};

obj.logout = function (uuid, token) {
    var deferred = defer();
    $.ajax({
        url: 'https://app.octoblu.com/api/auth',
        method: 'DELETE',
        headers: {
            skynet_auth_uuid: uuid,
            skynet_auth_token: token
        },
        timeout: timeout
    })
        .success(deferred.resolve)
        .error(deferred.reject);
    return deferred.promise;
};

obj.getIPAddress = function(){
    var deferred = defer();
    $.ajax(getAjax({
        url: baseURL + '/ipaddress',
        method: 'GET'
    }))
        .success(deferred.resolve)
        .error(deferred.reject);
    return deferred.promise;
};

module.exports = obj;
},{}],8:[function(_dereq_,module,exports){
'use strict';

var lib = {},
    key = 'topics',
    defaultKey = 'default_topics',
    loadedDefaults = [],
    topics = [];

function write() {
    window.mobibluStorage.setItem(key, topics);
}

function writeDefaults() {
    window.mobibluStorage.setItem(defaultKey, loadedDefaults);
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
    var obj = window.mobibluStorage.getItem(defaultKey) || [];

    return loadedDefaults = obj;
};

lib.saveDefaultTopic = function (topic) {

    if ((topic && topic.length)) return false;

    if (!topic.id) topic.id = utils.createID();

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

    var obj = window.mobibluStorage.getItem(key) || [];

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

    return getById(id);
};

lib.save = function (topic) {
    if ((topic && topic.length)) return false;

    if (!topic.id) topic.id = utils.createID();

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
},{}]},{},[3])
(3)
});