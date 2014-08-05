'use strict';
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


var baseURL = 'http://skynet.im';
var obj = {};

obj.getDevice = function (uuid, token) {
    var deferred = defer();

    if(!uuid && !token){
        deferred.resolve();
    }
    $.ajax({
        url: baseURL + '/devices/' + uuid,
        method: 'GET',
        headers: {
            skynet_auth_uuid: uuid,
            skynet_auth_token: token
        },
        timeout : 5 * 1000
    })
        .success(deferred.resolve)
        .error(deferred.reject);
    return deferred.promise;
};

obj.sendData = function (uuid, token, data) {
    var deferred = defer();
    $.ajax({
        url: baseURL + '/data/' + uuid,
        method: 'POST',
        params: data,
        headers: {
            skynet_auth_uuid: uuid,
            skynet_auth_token: token
        },
        timeout : 5 * 1000
    })
        .success(deferred.resolve)
        .error(deferred.reject);
    return deferred.promise;
};

obj.localdevices = function (settings) {
    var deferred = defer();
    $.ajax({
        url: baseURL + '/localdevices',
        method: 'GET',
        headers: {
            skynet_auth_uuid: settings.skynetuuid,
            skynet_auth_token: settings.skynettoken
        },
        timeout : 5 * 1000
    })
        .success(deferred.resolve)
        .error(deferred.reject);
    return deferred.promise;
};

obj.claimdevice = function (uuid, settings) {
    var deferred = defer();
    $.ajax({
        url: baseURL + '/claimdevice/' + uuid,
        method: 'PUT',
        headers: {
            skynet_auth_uuid: settings.skynetuuid,
            skynet_auth_token: settings.skynettoken
        },
        timeout : 5 * 1000
    })
        .success(deferred.resolve)
        .error(deferred.reject);
    return deferred.promise;
};

obj.logout = function (uuid, token) {
    var deferred = defer();
    $.ajax({
        url: 'https://app.octoblu.com/api/auth',
        method: 'DELETE',
        headers : {
            skynet_auth_uuid : uuid,
            skynet_auth_token : token
        },
        timeout : 5 * 1000
    })
        .success(deferred.resolve)
        .error(deferred.reject);
    return deferred.promise;
};



module.exports = obj;