var Skynet = (function(){
    var obj = this;

    // Octoblu User Data
    obj.skynetuuid = window.localStorage.getItem("skynetuuid");
    obj.skynettoken = window.localStorage.getItem("skynettoken");
    // Mobile App Data
    obj.mobileuuid = window.localStorage.getItem("mobileuuid");
    obj.mobiletoken = window.localStorage.getItem("mobiletoken");

    obj.isAuthenticated = function(){
        return obj.skynetuuid && obj.skynettoken;
    };

    obj.isRegistered = function(){
        return obj.mobileuuid && obj.mobiletoken;
    };

    obj.register = function () {
        if(obj.isRegistered()){
            // Already Registered & Update the device
            socket.emit('update', {
                "uuid": obj.mobileuuid,
                "token": obj.mobiletoken,
                "online": true
              }, function (data) {
                  alert(data);
              });
        }else{
            obj.skynetSocket.emit('register', {
                "name": "Octoblu Mobile",
                "owner": obj.skynetuuid,
                "online": true
            }, function (data) {
                data.mobileuuid = data.uuid;
                data.mobiletoken = data.token;
                window.localStorage.setItem("mobileuuid", data.uuid);
                window.localStorage.setItem("mobiletoken", data.token);
            });
        }
    };

    obj.auth = function(){
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

    if(obj.isAuthenticated()){
        obj.auth();
    }

    return obj;
})();
