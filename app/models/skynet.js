'use strict';

var skynetModel = angular.module('SkynetModel', ['restangular']);

skynetModel.service('SkynetRest', function ($http) {

    var obj = this,
        baseURL = 'http://skynet.im';

    obj.getDevice = function (uuid, token, callback) {
        $http({
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
        $http({
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

    return obj;

});

skynetModel.service('OctobluRest', function ($http) {

    var obj = this,
        baseURL = 'http://app.octoblu.com';

    obj.getDevices = function (uuid, token, callback) {

        $http({
            url: baseURL + '/api/owner/devices/' + uuid + '/' + token,
            method: 'GET',
            timeout : 5 * 1000
        }).success(function (data) {
            callback(data);
        })
        .error(function (error, status, headers, config) {
            console.log('Error: ', error, status, headers, config);
            callback({});
        });

    };

    obj.getGateways = function (uuid, token, includeDevices, callback) {
        // $http.get('/api/owner/gateways/' + uuid + '/' + token)
        $http({
            url: baseURL + '/api/owner/gateways/' + uuid + '/' + token,
            method: 'GET',
            params: {
                devices: includeDevices
            },
            timeout : 5 * 1000
        })
        .success(function (data) {
            callback(null, data);
        })
        .error(function (error, status, headers, config) {
            console.log('Error: ', error, status, headers, config);
            callback(error);
        });

    };

    obj.searchPlugins = function(term, callback){
        // api/devices/plugins?keywords=skynet-plugin

        $http({
            url: baseURL + '/api/devices/plugins/',
            method: 'GET',
            params: {
                keywords: term
            },
            timeout : 10 * 1000
        })
        .success(function (data) {
            callback(null, data);
        })
        .error(function (error, status, headers, config) {
            console.log('Error: ', error, status, headers, config);
            callback(error);
        });

    };

    return obj;

});