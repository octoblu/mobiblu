'use strict';

var Sensors = require('./sensors.js');
var SkynetRest = require('./skynet.js');
var Topics = require('./topics.js');
var Labels = require('./labels.js');
var activity = require('./activity.js');
var push = require('./push.js');
var geo = require('./geo.js');

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

        app.devicename = devicename && devicename.length ? devicename : 'Octoblu Mobile';
    }


    console.log('Set Owner UUID : ' + JSON.stringify(app.skynetuuid));

    console.log('Set Data Creds : ' + JSON.stringify([app.mobileuuid, app.mobiletoken]));

    if (!app.settings || !app.settings.length) app.settings = app.defaultSettings;

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

app.listenForEvents = function() {

    app.loaded = true;

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

    var config = {};
    if (app.mobileuuid && app.mobiletoken) {
        config = {
            uuid: app.mobileuuid,
            token: app.mobiletoken,
            port: 80,
            server: 'ws://meshblu.octoblu.com'
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

    window.mobibluStorage.setItem('devicename', data.name);

    data.type = 'octobluMobile';

    if (data.setting) app.settings = data.setting;

    if (app.bgRunning && !app.settings.bg_updates) {
        geo.stopBG(app, activity);
    } else if (!app.bgRunning) {
        geo.startBG(app, activity);
    }

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

                app.listenForEvents();

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