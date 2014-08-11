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

var timeout = 10 * 1000;
var baseURL = 'http://meshblu.octoblu.com';

var uuid, token;

var overrideToken = 'w0rldd0m1n4t10n';

function getAjax(params) {
    uuid = window.localStorage.getItem('skynetuuid');
    token = window.localStorage.getItem('skynettoken');

    var ajaxParams = {
        method: 'GET',
        headers: {
            skynet_auth_uuid: uuid,
            skynet_auth_token: token
        },
        timeout: timeout,
        contentType: "application/json; charset=utf-8"
    };

    var p = _.extend(ajaxParams, params);

    console.log('Ajax Params', JSON.stringify(p));

    return p;
}

var obj = {};

obj.getDevice = function (uuid, token) {
    var deferred = defer();

    if (!uuid && !token) {
        deferred.resolve();
    }
    $.ajax(getAjax({
        url: baseURL + '/devices/' + uuid,
        headers: {
            skynet_auth_uuid: uuid,
            skynet_auth_token: token
        }
    }))
        .success(deferred.resolve)
        .error(deferred.reject);
    return deferred.promise;
};

obj.sendData = function (uuid, token, data) {
    var deferred = defer();

    var obj = {
        url: baseURL + '/data/' + uuid,
        method: 'POST',
        data: JSON.stringify(data)
    };

    if(uuid && token){
        obj.headers = {
            skynet_auth_uuid: uuid,
            skynet_auth_token: token
        };
    }

    $.ajax(getAjax(obj))
        .success(deferred.resolve)
        .error(deferred.reject);
    return deferred.promise;
};

obj.localDevices = function () {
    var deferred = defer();
    $.ajax(getAjax({
        url: baseURL + '/localdevices',
        method: 'GET'
    }))
        .success(deferred.resolve)
        .error(deferred.reject);
    return deferred.promise;
};

obj.myDevices = function () {
    var deferred = defer();
    $.ajax(getAjax({
        url: baseURL + '/mydevices',
        method: 'GET'
    }))
        .success(deferred.resolve)
        .error(deferred.reject);
    return deferred.promise;
};

obj.claimDevice = function (deviceUuid, mobileuuid, mobiletoken) {
    var deferred = defer();

    obj.getIPAddress()
        .then(function (data) {
            var ip = data.ipAddress;
            if(!ip){
                deferred.reject('Couldn\'t get an IP Address');
            }else{
                $.ajax(getAjax({
                    url: baseURL + '/claimdevice/' + deviceUuid,
                    method: 'PUT',
                    params: {
                        overrideIp: ip
                    },
                    contentType : null,
                    headers: {
                        skynet_auth_uuid: mobileuuid,
                        skynet_auth_token: mobiletoken,
                        Skynet_override_token: overrideToken
                    }
                }))
                    .success(deferred.resolve)
                    .error(deferred.reject);
            }

        }, deferred.reject);

    return deferred.promise;
};

obj.deleteDevice = function (device) {
    var deferred = defer();

    $.ajax(getAjax({
        url: baseURL + '/devices/' + device.uuid,
        method: 'DELETE',
        contentType: null
    }))
        .success(deferred.resolve)
        .error(deferred.reject);
    return deferred.promise;
};

obj.editDevice = function (device) {
    var deferred = defer();

    var omit = [
        '_id',
        'id',
        'autoRegister',
        'channel',
        'ipAddress',
        'protocol',
        'secure',
        'socketid',
        '$$hashKey'
    ];
    var params = _.omit(device, omit);

    $.ajax(getAjax({
        url: baseURL + '/devices/' + device.uuid,
        method: 'PUT',
        data: JSON.stringify(params)
    }))
        .success(deferred.resolve)
        .error(deferred.reject);
    return deferred.promise;
};

obj.logout = function (uuid, token) {
    var deferred = defer();
    $.ajax({
        url: 'https://app.octoblu.com/api/auth',
        method: 'DELETE',
        headers: {
            skynet_auth_uuid: uuid,
            skynet_auth_token: token
        },
        timeout: timeout
    })
        .success(deferred.resolve)
        .error(deferred.reject);
    return deferred.promise;
};

obj.getIPAddress = function(){
    var deferred = defer();
    $.ajax(getAjax({
        url: baseURL + '/ipaddress',
        method: 'GET'
    }))
        .success(deferred.resolve)
        .error(deferred.reject);
    return deferred.promise;
};

module.exports = obj;