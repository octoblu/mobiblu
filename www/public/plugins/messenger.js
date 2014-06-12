'use strict';

var obj = {};

var Skynet = global.Skynet;
obj.skynetObj = {};
obj.socket = null;

// Called Every Time the Messenger is needed
obj.init = function () {
    Skynet = global.Skynet;
    obj.skynetObj = Skynet.getCurrentSettings();
    obj.socket = obj.skynetObj.skynetSocket;
    return obj;
};

obj.send = function (data, callback) {
    if (obj.socket) {
        obj.socket.emit('message', data, callback);
    } else {
        callback(new Error('Socket not available'));
    }
};

var Messenger = {
    init: obj.init,
    send: obj.send
};

module.exports = Messenger;
