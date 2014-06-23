'use strict';

var skynetModel = angular.module('SkynetModel', ['SensorModel', 'restangular']);

skynetModel.service('SkynetRest', function ($http) {

    var obj = this,
        baseURL = 'http://skynet.im';

    obj.getDevice = function (uuid, token, callback) {
        $http({
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
        $http({
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

    return obj;

});

skynetModel.service('OctobluRest', function ($http) {

    var obj = this,
        baseURL = 'http://app.octoblu.com';

    obj.getDevices = function (uuid, token, callback) {

        $http({
            url: baseURL + '/api/owner/devices/' + uuid + '/' + token,
            method: 'GET',
            timeout : 5 * 1000
        }).success(function (data) {
            callback(data);
        })
        .error(function (error, status, headers, config) {
            console.log('Error: ', error, status, headers, config);
            callback({});
        });

    };

    obj.getGateways = function (uuid, token, includeDevices, callback) {
        // $http.get('/api/owner/gateways/' + uuid + '/' + token)
        $http({
            url: baseURL + '/api/owner/gateways/' + uuid + '/' + token,
            method: 'GET',
            params: {
                devices: includeDevices
            },
            timeout : 5 * 1000
        })
        .success(function (data) {
            callback(null, data);
        })
        .error(function (error, status, headers, config) {
            console.log('Error: ', error, status, headers, config);
            callback(error);
        });

    };

    obj.searchPlugins = function(term, callback){
        // api/devices/plugins?keywords=skynet-plugin

        $http({
            url: baseURL + '/api/devices/plugins/',
            method: 'GET',
            params: {
                keywords: term
            },
            timeout : 10 * 1000
        })
        .success(function (data) {
            callback(null, data);
        })
        .error(function (error, status, headers, config) {
            console.log('Error: ', error, status, headers, config);
            callback(error);
        });

    };

    return obj;

});

skynetModel.factory('Skynet', function ($rootScope, Sensors, SkynetRest) {
    var obj = this;

    var Skynet = (function(obj){

        if(obj.initilized) return obj;

        obj.loaded = false;

        obj.defaultSettings = {
            compass: true,
            accelerometer: true,
            geolocation: true,
            update_interval: 1,
            bg_updates: true,
            developer_mode: false
        };

        var sensActBadge = $('#sensor-activity-badge'),
            x = window.localStorage.getItem('activitycount') || 0;

        obj.setData = function () {
            var devicename = window.localStorage.getItem('devicename');

            obj.devicename = devicename && devicename.length ? devicename : 'Octoblu Mobile';
            // Octoblu User Data
            obj.skynetuuid = window.localStorage.getItem('skynetuuid');
            obj.skynettoken = window.localStorage.getItem('skynettoken');
            //Push ID
            obj.pushID = window.localStorage.getItem('pushID');
            // Logged In
            obj.loggedin = !! window.localStorage.getItem('loggedin');
            // Mobile App Data
            obj.mobileuuid = window.localStorage.getItem('mobileuuid');
            obj.mobiletoken = window.localStorage.getItem('mobiletoken');

            obj.settings = obj.defaultSettings;

            obj.settingsUpdated = false;

            obj.sensorIntervals = {};

            obj.skynetActivity = obj.getActivity();
        };

        obj.logout = function () {

            window.localStorage.removeItem('skynetuuid');
            window.localStorage.removeItem('skynettoken');
            obj.skynetuuid = null;
            obj.skynettoken = null;

            window.loggedin = obj.loggedin = false;
            window.localStorage.removeItem('loggedin');

            window.localStorage.removeItem('skynetactivity');

            obj.setData();

            window.open('http://app.octoblu.com/logout?js=1&referrer=' + encodeURIComponent('http://localhost/index.html#!/login'), '_self', 'location=yes');
        };

        obj.login = function () {
            window.open('http://app.octoblu.com/login?js=1&referrer=' + encodeURIComponent('http://localhost/login.html'), '_self', 'location=yes');
        };

        obj.isAuthenticated = function () {
            //console.log(JSON.stringify([obj.loggedin, obj.skynetuuid, obj.skynettoken]));
            return !!(obj.loggedin && obj.skynetuuid && obj.skynettoken);
        };

        obj.isRegistered = function (callback) {
            obj.whoami(null, null, function (data) {
                if (data.uuid === obj.mobileuuid) {
                    callback(true);
                } else {
                    callback(false);
                }
            });
        };

        obj.isRegisteredOld = function () {
            return !!(obj.mobileuuid && obj.mobiletoken);
        };

        obj.startProcesses = function () {

            if(!obj.loaded){

                obj.loaded = true;

                if(!obj.pushID){
                    document.addEventListener('urbanairship.registration', function (event) {
                        if (event.error) {
                            console.log('Urbanairship Registration Error');
                        } else {
                            obj.pushID = event.pushID;
                            window.localStorage.setItem('pushID', obj.pushID);

                            steroids.addons.urbanairship
                            .notifications.onValue(function(notification) {
                                obj.logActivity({
                                    type : 'PushNotification',
                                    html : notification.message
                                });
                            });

                            obj.updateDeviceSetting({}, function () {});
                        }
                    }, false);
                }

                obj.skynetSocket.on('message', function (data) {
                    obj.logActivity({
                        type : 'SkynetMessage',
                        html : 'From: ' + data.fromUuid +
                             '<br>Message: ' + data.payload
                    });
                });

                $(document).trigger('octoblu-loaded');

            }

            obj.logSensorData();
            obj.startBG();
        };

        obj.register = function (callback) {
            obj.isRegistered(function (registered) {
                if (registered) {

                    // Already Registered & Update the device
                    obj.updateDeviceSetting({
                        'type': 'octobluMobile'
                    }, function (data) {
                        callback(data);
                        obj.startProcesses();
                    });

                } else {
                    var regData = {
                        'name': obj.devicename,
                        'owner': obj.skynetuuid,
                        'type': 'octobluMobile',
                        'online': true
                    };

                    if(obj.pushID) regData.pushID = obj.pushID;

                    obj.skynetSocket.emit('register', regData, function (data) {

                        data.mobileuuid = data.uuid;
                        data.mobiletoken = data.token;

                        obj.mobileuuid = data.mobileuuid;
                        obj.mobiletoken = data.mobiletoken;

                        window.localStorage.setItem('mobileuuid', data.uuid);
                        window.localStorage.setItem('mobiletoken', data.token);
                        window.localStorage.setItem('devicename', data.name);

                        callback(data);
                        obj.startProcesses();
                    });
                }
            });

        };

        obj.auth = function (callback) {
            if (obj.skynetSocket) {
                return obj.getDeviceSetting(null, null, callback);
            }
            // GETS HERE
            var data = {
                'uuid': obj.mobileuuid || obj.skynetuuid,
                'token': obj.mobiletoken || obj.skynettoken
            };
            obj.skynetClient = skynet(data, function (e, socket) {
                console.log('here', JSON.stringify(data));
                if (e) {
                    console.log(e.toString());
                    obj.logActivity({
                        type : 'Skynet',
                        error : e
                    });
                    callback();
                } else {
                    obj.skynetSocket = socket;
                    obj.register(callback);
                }
            });
        };

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
            x = 0;
            sensActBadge.text(x.toString());
            sensActBadge.removeClass('badge-negative');
            window.localStorage.setItem('activitycount', x);
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
                sensActBadge.text('Error');
                sensActBadge.addClass('badge-negative');
            }else{
                x++;
                sensActBadge.text(x.toString() + ' New');
                sensActBadge.removeClass('badge-negative');
            }

            var string = JSON.stringify(obj.skynetActivity);

            window.localStorage.setItem('skynetactivity', string);
            window.localStorage.setItem('activitycount', x);
            $(document).trigger('skynetactivity', true);
        };

        obj.logSensorData = function () {
            var sensors = [];

            obj.getDeviceSetting(null, null, function () {
                // Push Sensors
                if (!obj.settings || obj.settings.geolocation) sensors.push('Geolocation');
                if (!obj.settings || obj.settings.compass) sensors.push('Compass');
                if (!obj.settings || obj.settings.accelerometer) sensors.push('Accelerometer');

                var wait = 1;

                if (obj.settings) {
                    if (obj.settings.update_interval) {
                        wait = obj.settings.update_interval;
                    } else if (obj.settings.update_interval === 0) {
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
                            obj.skynetSocket.emit('data', {
                                'uuid' : obj.mobileuuid,
                                'token' : obj.mobiletoken,
                                'sensorData' : {
                                    'type' : type,
                                    'data' : sensorData
                                }
                            }, function () {
                                obj.logActivity({
                                    type : type,
                                    data : sensorData,
                                    html : sensor.prettify(sensorData)
                                });
                            });

                        },
                        // Handle Errors
                        function (err) {
                            obj.logActivity({
                                type : type,
                                error : err
                            });
                        }
                    );
                };

                sensors.forEach(function (sensorType) {
                    if (sensorType && typeof Sensors[sensorType] === 'function') {
                        if(obj.sensorIntervals[sensorType]) {
                            clearInterval(obj.sensorIntervals[sensorType]);
                        }
                        throttled[sensorType] = _.throttle(startSensor, wait);
                        // Trigger Sensor Data every wait
                        var sensorObj = Sensors[sensorType](1000);
                        obj.sensorIntervals[sensorType] = setInterval(function () {
                            throttled[sensorType](sensorObj, sensorType);
                        }, wait);
                    }
                });
            });
        };

        obj.startBG = function () {
            // If BG Updates is turned off
            Sensors.Geolocation(1000).start(function () {
                obj.bgGeo = window.plugins ? window.plugins.backgroundGeoLocation : null;

                if (!obj.bgGeo) {
                    return;
                }

                if (!obj.settings.bg_updates) return obj.bgGeo.stop();

                console.log('Starting background location updates');

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
                    r.open('POST', 'http://skynet.im/data/' + obj.mobileuuid, true);
                    r.setRequestHeader('Content-type', 'application/json');
                    r.setRequestHeader('skynet_auth_uuid', obj.mobileuuid);
                    r.setRequestHeader('skynet_auth_token', obj.mobiletoken);

                    r.onreadystatechange = function () {
                        if (r.readyState !== 4 || r.status !== 200) return;
                        console.log('Success: ' + r.responseText);

                        obj.logActivity({
                            type : 'BG_Geolocation',
                            html : 'Successfully updated background location'
                        });
                    };

                    r.send(send);
                    obj.bgGeo.finish();
                };
                /**
                 * This callback will be executed every time a geolocation is recorded in the background.
                 */
                var callbackFn = function (location) {
                    sendToSkynet(location);
                };

                var failureFn = function (err) {
                    obj.logActivity({
                        type : 'BG_Geolocation',
                        error : err
                    });

                    console.log('BackgroundGeoLocation error');
                };

                // BackgroundGeoLocation is highly configurable.
                obj.bgGeo.configure(callbackFn, failureFn, {
                    url: 'http://skynet.im/data/' + obj.mobileuuid, // <-- only required for Android; ios allows javascript callbacks for your http
                    params: { // HTTP POST params sent to your server when persisting locations.
                    },
                    headers: {
                        'skynet_auth_uuid': obj.mobileuuid,
                        'skynet_auth_token': obj.mobiletoken
                    },
                    desiredAccuracy: 10,
                    stationaryRadius: 20,
                    distanceFilter: 30,
                    debug: true // <-- enable this hear sounds for background-geolocation life-cycle.
                });

                obj.bgGeo.start();

            }, function (err) {
                console.log('Error', err);
            });

        };

        obj.updateDeviceSetting = function (data, callback) {
            // Extend the data option
            data.uuid = obj.mobileuuid;
            data.token = obj.mobiletoken;
            data.online = true;
            data.owner = obj.skynetuuid;
            data.pushID = obj.pushID;
            data.name = data.name || obj.devicename;
            obj.type = 'octobluMobile';

            obj.skynetSocket.emit('update', data, function(res){
                // obj.logActivity({
                //     type : 'UpdateDevice',
                //     html : 'Successfully updated device'
                // });
                callback(res);
            });
        };

        obj.message = function (data, callback) {
            if(!data.uuid) data.uuid = obj.mobileuuid;
            if(!data.token) data.token = obj.mobiletoken;

            obj.skynetSocket.emit('message', data, function(d){
                obj.logActivity({
                    type : 'SentMessage',
                    html : 'Sending Message: ' + JSON.stringify(data.payload)
                });
                callback(d);
            });
        };

        obj.whoami = function (uuid, token, callback) {
            obj.skynetSocket.emit('whoami', {
                uuid: uuid || obj.mobileuuid,
                token: token || obj.mobiletoken
            }, callback);
        };

        obj.getDeviceSetting = function (uuid, token, callback) {
            if(obj.settingsUpdated){
                return callback({
                    setting : obj.settings
                });
            }
            SkynetRest.getDevice(uuid || obj.mobileuuid,
                token || obj.mobiletoken,
                function (err, data) {
                    var device;

                    if(!data) return callback();

                    if (data.devices && data.devices.length) {
                        device = data.devices[0];
                    } else {
                        device = data;
                    }
                    if (!uuid || uuid !== obj.mobileuuid) {
                        if (device.setting) {
                            obj.settingsUpdated = true;
                            obj.settings = device.setting;
                        } else {
                            obj.settings = obj.defaultSettings;
                        }
                    }

                    callback(device);
                });
        };

        obj.init = function (callback) {
            obj.setData();

            if (obj.isAuthenticated()) {
                obj.auth(callback);
            } else {
                callback();
            }
        };

        obj.setData();

        return obj;
    })(window.Skynet || obj);

    var publicApi = window.Skynet = {
        initilized : true,
        init : Skynet.init,
        getDeviceSetting : Skynet.getDeviceSetting,
        whoami : Skynet.whoami,
        message : Skynet.message,
        updateDeviceSetting : Skynet.updateDeviceSetting,
        logout : Skynet.logout,
        login : Skynet.login,
        isAuthenticated : Skynet.isAuthenticated,
        logSensorData : Skynet.logSensorData,
        clearActivityCount : Skynet.clearActivityCount,
        getCurrentSettings : function(){
            return {
                skynetSocket : Skynet.skynetSocket,
                devicename : Skynet.devicename,
                loggedin : Skynet.loggedin,
                mobileuuid : Skynet.mobileuuid,
                mobiletoken : Skynet.mobiletoken,
                skynetuuid : Skynet.skynetuuid,
                skynettoken : Skynet.skynettoken,
                settings : Skynet.settings
            };
        },
        getActivity : Skynet.getActivity,
        logActivity : Skynet.logActivity
    };

    return publicApi;
});
