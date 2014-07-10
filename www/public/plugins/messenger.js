'use strict';

var obj = {};

var Skynet = null;
obj.skynetObj = {};
obj.socket = null;

// Called Every Time the Messenger is needed
obj.init = function () {
    Skynet = window.Skynet;
    obj.skynetObj = Skynet.getCurrentSettings();
    obj.conn = obj.skynetObj.conn;
    return obj;
};

obj.send = function (data, callback) {
    if (obj.conn) {
        Skynet.message(data)
            .then(callback, function () {
                console.log('Error Sending Message');
            });
    } else {
        callback(new Error('Socket not available'));
    }
};

var Messenger = {
    init: obj.init,
    send: obj.send
};

module.exports = Messenger;
