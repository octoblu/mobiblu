var module = angular.module('SkynetModel', ['SensorModel', 'restangular']);

module.factory('Skynet', function ($rootScope, Sensors) {
    var obj = this,
        devicename = window.localStorage.getItem("devicename");

    obj.devicename = devicename && devicename.length ? devicename : "Octoblu Mobile (" + device.model + ")";
    // Octoblu User Data
    obj.skynetuuid = window.localStorage.getItem("skynetuuid");
    obj.skynettoken = window.localStorage.getItem("skynettoken");
    // Mobile App Data
    obj.mobileuuid = window.localStorage.getItem("mobileuuid");
    obj.mobiletoken = window.localStorage.getItem("mobiletoken");

    obj.isAuthenticated = function () {
        return obj.skynetuuid && obj.skynettoken;
    };

    obj.isRegistered = function () {
        return obj.mobileuuid && obj.mobiletoken;
    };

    obj.register = function (callback) {
        if (obj.isRegistered()) {
            // Already Registered & Update the device
            obj.updateDeviceSetting({}, function (data) {
                callback(data);
                obj.logSensorData();
            });
        } else {
            obj.skynetSocket.emit('register', {
                "name": obj.devicename,
                "owner": obj.skynetuuid,
                "online": true
            }, function (data) {

                data.mobileuuid = data.uuid;
                data.mobiletoken = data.token;

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
            x = 0;
        ['Geolocation', 'Compass', 'Accelerometer'].forEach(function (sensorType) {
                if (sensorType && typeof Sensors[sensorType] === 'function') {
                    var sensorObj = Sensors[sensorType]();
                    sensorObj.start(function (sensorData) {
                            obj.skynetSocket.emit('data', {
                                "uuid": obj.mobileuuid,
                                "token": obj.mobiletoken,
                                "sensorData": {
                                    "type": sensorType,
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
                                var html = '<strong>Sensor:</strong> ' + sensorType + '<br>';
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
                }
            });
    };

    obj.updateDeviceSetting = function (data, callback) {
        // Extend the data option
        data.mobileuuid = obj.mobileuuid;
        data.mobiletoken = obj.mobiletoken;
        data.online = true;
        data.name = data.name || obj.devicename;

        obj.skynetSocket.emit('update', data, callback);
    };

    obj.message = function (data, callback) {
        obj.skynetSocket.emit('message', data, callback);
    };

    obj.getDeviceSetting = function (callback) {
        obj.skynetSocket.emit('whoami', {
            uuid: obj.mobileuuid
        }, callback);
    };

    obj.init = function (callback) {

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
