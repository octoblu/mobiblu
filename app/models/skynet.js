var module = angular.module('SkynetModel', ['SensorModel', 'restangular']);

module.factory('Skynet', function ($rootScope, Sensors) {
    var obj = this,
        devicename = window.localStorage.getItem("devicename");

    obj.setData = function(){
        obj.devicename = devicename && devicename.length ? devicename : "Octoblu Mobile (" + device.model + ")";
        // Octoblu User Data
        obj.skynetuuid = window.localStorage.getItem("skynetuuid");
        obj.skynettoken = window.localStorage.getItem("skynettoken");
        //Push ID
        obj.pushID = window.localStorage.getItem("pushID");
        // Logged In
        obj.loggedin = !!window.localStorage.getItem("loggedin");
        // Mobile App Data
        obj.mobileuuid = window.localStorage.getItem("mobileuuid");
        obj.mobiletoken = window.localStorage.getItem("mobiletoken");
    };

    obj.setData();

    obj.isAuthenticated = function () {
        return obj.loggedin && obj.skynetuuid && obj.skynettoken;
    };

    obj.isRegistered = function () {
        return obj.mobileuuid && obj.mobiletoken;
    };

    obj.register = function (callback) {
        console.log('Registering', obj.skynetuuid, obj.skynettoken, obj.mobileuuid, obj.mobiletoken);
        if (obj.isRegistered() && obj.isAuthenticated()) {
            // Already Registered & Update the device
            obj.updateDeviceSetting({
                'type' : 'octobluMobile'
            }, function (data) {
                callback(data);
                obj.logSensorData();
            });
        } else {
            obj.skynetSocket.emit('register', {
                'name': obj.devicename,
                'owner': obj.skynetuuid,
                'type' : 'octobluMobile',
                'online': true,
                'pushID' : obj.pushID || undefined
            }, function (data) {

                data.mobileuuid = data.uuid;
                data.mobiletoken = data.token;

                obj.mobileuuid = data.mobileuuid;
                obj.mobiletoken = data.mobiletoken;

                window.localStorage.setItem("mobileuuid", data.uuid);
                window.localStorage.setItem("mobiletoken", data.token);

                window.localStorage.setItem("devicename", data.name);

                callback(data);
                obj.logSensorData();
            });
        }
    };

    obj.auth = function (callback) {
        // GETS HERE
        obj.skynetClient = skynet({
            'uuid': obj.skynetuuid,
            'token': obj.skynettoken
        }, function (e, socket) {
            // DOESN'T HIT THIS **
            if (e) {
                console.log(e.toString());
            } else {
                obj.skynetSocket = socket;
                obj.register(callback);
            }
        });
    };

    obj.logSensorData = function () {
        var sensAct = document.getElementById('sensor-activity'),
            sensActBadge = document.getElementById('sensor-activity-badge'),
            sensorErrors = document.getElementById('sensor-errors'),
            x = 0,
            sensors = [];

        obj.getDeviceSetting(obj.mobileuuid, function(data){
            if(!data.setting || data.setting.geolocation) sensors.push('Geolocation');
            if(!data.setting || data.setting.compass) sensors.push('Compass');
            if(!data.setting || data.setting.accelerometer) sensors.push('Accelerometer');
            var wait = 1;
            if(data.setting){
                if(data.setting.update_interval){
                    wait = data.setting.update_interval;
                }else if(data.setting.update_interval === 0){
                    wait = 0.5;
                }
            }
            wait = wait * 60 * 1000;
            console.log(wait);
            var throttled = {};
            sensors.forEach(function (sensorType) {
                if (sensorType && typeof Sensors[sensorType] === 'function') {
                     throttled[sensorType] = _.throttle(function(sensor, type){
                        var sent = false;
                        console.log('Sensor!', JSON.stringify(sensor));
                        sensor.start(function (sensorData) {
                            if(sent) return;
                            console.log('Sensor Data!', JSON.stringify(sensorData));
                            sent = true;
                            obj.skynetSocket.emit('data', {
                                "uuid": obj.mobileuuid,
                                "token": obj.mobiletoken,
                                "sensorData": {
                                    "type": type,
                                    "data": sensorData
                                }
                            }, function (data) {
                                x++;
                                sensActBadge.innerHTML = x.toString();
                                sensActBadge.className = 'badge badge-negative';
                            });
                        },
                        function (err) {
                            if (sensorErrors) {
                                var html = '<strong>Sensor:</strong> ' + type + '<br>';
                                if (err.code) {
                                    html = html + '<strong>Error Code:</strong> ' + err.code + '<br>';
                                }
                                if (err.message) {
                                    html = html + '<strong>Error Message:</strong> ' + err.message + '<br>';
                                }
                                if (!err.message && !err.code) {
                                    html = html + '<strong>Error:</strong> ' + err + '<br>';
                                }
                                sensorErrors.innerHTML = sensorErrors.innerHTML + html + '<hr>';
                            }

                            sensActBadge.innerHTML = 'Error';
                            sensActBadge.className = 'badge';
                        });
                    }, wait);
                    var sensorObj = Sensors[sensorType](1000);
                    setInterval(function(){
                        throttled[sensorType](sensorObj, sensorType);
                    }, wait);
                }
            });
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

        obj.skynetSocket.emit('update', data, callback);
    };

    obj.message = function (data, callback) {
        data.uuid = obj.mobileuuid;
        data.token = obj.mobiletoken;
        obj.skynetSocket.emit('message', data, callback);
    };

    obj.getDeviceSetting = function (uuid, callback) {
        obj.skynetSocket.emit('whoami', {
            uuid: uuid
        }, callback);
    };

    obj.init = function (callback) {
        obj.setData();
        document.addEventListener("urbanairship.registration", function (event) {
            if (event.error) {
            } else {
                obj.pushID = event.pushID;
                window.localStorage.setItem("pushID", obj.pushID);
                obj.updateDeviceSetting({}, function (data) {
                    callback(data);
                    obj.logSensorData();
                });
            }
        }, false);

        if (obj.isAuthenticated()) {
            obj.auth(callback);
        }
    };



    return obj;
});

module.service('SkynetRest', function ($http) {

    var obj = this,
        baseURL = 'http://skynet.im';

    obj.getDevice = function(uuid, callback){
        $http.get(baseURL + '/devices/' + uuid)
        .success(function(data, status, headers, config) {
            callback(data);
        })
        .error(function(data, status, headers, config) {
            callback({});
        });
    };

    return obj;

});

module.service('OctobluRest', function ($http) {

    var obj = this,
        baseURL = 'http://octoblu.com';

    obj.getDevices = function(uuid, token, callback){
        $http.get(baseURL + '/api/owner/devices/' + uuid + '/' + token)
        .success(function(data, status, headers, config) {
            callback(data);
        })
        .error(function(data, status, headers, config) {
            callback({});
        });
    };

    obj.getGateways = function(uuid, token, includeDevices, callback) {
        // $http.get('/api/owner/gateways/' + uuid + '/' + token)
        console.log(baseURL + '/api/owner/gateways/' + uuid + '/' + token);
        $http({
            url: baseURL + '/api/owner/gateways/' + uuid + '/' + token,
            method: 'get',
            params: {
                devices: includeDevices
            }
        }).success(function(data) {
            callback(null, data);
        })
        .error(function(error) {
            console.log('Error: ' + error);
            callback(error, null);
        });

    };

    return obj;

});
