'use strict';

var baseURL = 'http://skynet.im';
var obj = {};

obj.getDevice = function (uuid, token, callback) {
    $.ajax({
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
        .success(function (data) {
            callback(null, data);
        })
        .error(function (data, status, headers, config) {
            console.log('Error: ', data, status, headers, config);
            callback(data);
        });
};

module.exports = obj;