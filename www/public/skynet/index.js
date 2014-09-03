'use strict';

var Sensors = require('./sensors.js');
var SkynetRest = require('./skynet.js');
var Topics = require('./topics.js');
var Labels = require('./labels.js');
var activity = require('./activity.js');
var push = require('./push.js');
var geo = require('./geo.js');

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

app.settingsUpdated = false;

app.dataTimeout = null;

app.dataQueue = [];

app.dataLastSent = null;

var ls = window.localStorage;
var ms = window.mobibluStorage;

app.setData = function(skynetuuid, skynettoken) {
    if (!skynetuuid){
        skynetuuid = ls.getItem('skynetuuid');
    }
    if (!skynettoken) {
        skynettoken = ls.getItem('skynettoken');
    }

    // Set new Skynet Tokens
    if (skynetuuid && skynettoken) {
        console.log('Octoblu Credentials');

        ms.writeConfig({
            user: skynetuuid
        });

        // Octoblu User Data
        app.skynetuuid = skynetuuid;
        app.skynettoken = skynettoken;
        // Logged In
        app.loggedin = ls.getItem('loggedin');

        if (app.loggedin === 'true') {
            app.loggedin = true;
        } else if (app.loggedin === 'false') {
            app.loggedin = false;
        } else {
            app.loggedin = !!app.loggedin;
        }

        //Push ID
        app.pushID = ls.getItem('pushID');
        // Mobile App Data
        app.mobileuuid = ms.getItem('mobileuuid');
        app.mobiletoken = ms.getItem('mobiletoken');

        var devicename = ms.getItem('devicename');

        console.log('Device Name: ' + JSON.stringify(devicename));

        if(devicename && devicename.length){
            app.devicename = devicename;
        }else{
            var platform = window.device ? ' ' + window.device.platform : '';
            app.devicename = 'Mobiblu' + platform;
        }

        app.settings = ms.getItem('settings') || {};
        if (_.isEmpty(app.settings)) {
            app.settings = app.defaultSettings;
        }else{
            app.settingsUpdated = true;
        }
    }

    console.log('Owner UUID : ' + JSON.stringify(app.skynetuuid));

    console.log('Mobile Data Credentials : ' + JSON.stringify([app.mobileuuid, app.mobiletoken]));

    app.socketid = null;

    return true;
};

app.login = function(uuid, token) {
    app.setData(uuid, token);
    app.loggedin = true;
};

app.logout = function() {

    window.loggedin = app.loggedin = false;

    ls.removeItem('loggedin');
    ls.removeItem('skynetuuid');
    ls.removeItem('skynettoken');

    app.setData();
};

app.isAuthenticated = function() {
    return !!(app.loggedin && app.skynetuuid && app.skynettoken);
};

app.hasAuth = function() {
    return !!(app.skynetuuid && app.skynettoken);
};

app.isRegistered = function() {
    var deferred = Px.defer();

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

    var deferred = Px.defer();

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
            ms.setItem('mobileuuid', data.uuid);
            ms.setItem('mobiletoken', data.token);
            ms.setItem('devicename', data.name);

            app.mobileuuid = data.uuid;
            app.mobiletoken = data.token;
            app.devicename = data.name;

            deferred.resolve();
        });
    return deferred.promise;
};

app.register = function(registered) {

    var deferred = Px.defer();

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
        port: window.mobibluConfig.SKYNET_PORT,
        server: 'ws://' + window.mobibluConfig.SKYNET_HOST
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

        ms.setItem('mobileuuid', data.uuid);
        ms.setItem('mobiletoken', data.token);

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

    var deferred = Px.defer();

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
    var deferred = Px.defer();
    // Extend the data option
    data.uuid = app.mobileuuid;
    data.token = app.mobiletoken;
    data.online = true;
    data.owner = app.skynetuuid;
    data.pushID = app.pushID;
    data.platform = window.device ? window.device.platform : 'iOS';
    data.name = app.devicename = data.name || app.devicename;

    if (!data.flows) data.flows = Topics.getAll();

    data.type = 'octobluMobile';

    ms.setItem('devicename', data.name);

    if (data.setting) {
        ms.setItem('settings', data.setting);
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
    var deferred = Px.defer();
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
    var deferred = Px.defer();

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
    var deferred = Px.defer();

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


    function send(data, i){
        if(!_.isUndefined(i) && i >= 0){
            app.dataQueue.splice(i, 1);
        }
        app.dataLastSent = new Date();
        console.log('Sending Data');
        app.conn.data(data, function() {});
    }
    var timeout = 15 * 1000;
    var currentTime = new Date().getTime();
    if(app.dataLastSent && currentTime > ( app.dataLastSent.getTime() + timeout )){
        send(data);
    }else if(!app.dataTimeout){
        send(data);
        app.dataTimeout = setTimeout(function(){
            _.each(app.dataQueue, send);
            clearTimeout(app.dataTimeout);
            app.dataTimeout = null;
        }, timeout);
    }else{
        app.dataQueue.push(data);
    }
    deferred.resolve();

    return deferred.promise;
};

app.triggerTopic = function(name, payload) {
    var deferred = Px.defer();

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
    var deferred = Px.defer();

    app.conn.whoami({
        uuid: uuid || app.mobileuuid,
        token: token || app.mobiletoken
    }, deferred.resolve);

    return deferred.promise;
};

app.getDeviceSetting = function(uuid, token) {
    var deferred = Px.defer();

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
    var deferred = Px.defer();

    app.setData(skynetuuid, skynettoken);

    activity.init();

    if (!app.isAuthenticated()) {
        console.log('Not Authenticated');
        deferred.resolve();
    } else {
        document.addEventListener('deviceready', function(){
            // Connect to Skynet
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