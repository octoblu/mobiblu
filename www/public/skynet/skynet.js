'use strict';
var Q = require('Q');

var baseURL = 'http://skynet.im';
var obj = {};

obj.getDevice = function (uuid, token) {
    var deferred = Q.defer();

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
    var deferred = Q.defer();
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

module.exports = obj;