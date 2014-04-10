document.addEventListener("deviceready", skynetDeviceReady, false);

var Skynet = null;

function skynetDeviceReady() {
    Skynet = (function () {
        var obj = this;

        obj.devicename = "Octoblu Mobile (" + device.model + ")";
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

        obj.register = function () {
            if (obj.isRegistered()) {
                // Already Registered & Update the device
                obj.skynetSocket.emit('update', {
                    "uuid": obj.mobileuuid,
                    "token": obj.mobiletoken,
                    "name": obj.devicename,
                    "online": true
                }, function (data) {
                    var event = new CustomEvent("skynetready", data);
                    document.dispatchEvent(event);
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

                    var event = new CustomEvent("skynetready", data);
                    document.dispatchEvent(event);
                    obj.logSensorData();
                });
            }
        };

        obj.auth = function () {
            obj.skynetClient = skynet({
                'uuid': obj.skynetuuid,
                'token': obj.skynettoken
            }, function (e, socket) {
                if (e) {
                    console.log(e.toString());
                } else {
                    obj.skynetSocket = socket;
                    obj.register();

                }
            });
        };

        obj.logSensorData = function () {
            var sensAct = document.getElementById('sensor-activity'),
                sensActBadge = document.getElementById('sensor-activity'),
                x = 0;
            ['Geolocation', 'Compass', 'Accelerometer'].forEach(function(sensorType){
                if(sensorType && typeof Sensors[sensorType] === 'function'){
                    var sensorObj = Sensors[sensorType]();
                    sensorObj.start(function(sensorData){
                        obj.skynetSocket.emit('data', {
                            "uuid": obj.mobileuuid,
                            "token": obj.mobiletoken,
                            "sensorData": {
                                "type" : sensorType,
                                "data" : sensorData
                            }
                        }, function (data) {
                            x++;
                            sensActBadge.innerHTML = x.toString();
                            sensActBadge.className = 'badge badge-negative';
                        });
                    },
                    function(err){
                        sensActBadge.innerHTML = 'Error';
                        sensActBadge.className = 'badge';
                    });
                }
            });
        };

        if (obj.isAuthenticated()) {
            obj.auth();
        }

        return obj;
    })();

}
