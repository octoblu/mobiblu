'use strict';

var skynetModel = angular.module('SkynetModel', ['restangular']);

skynetModel.service('SkynetRest', function ($http) {

    var obj = this,
        baseURL = 'http://skynet.im';

    obj.getDevice = function (uuid, token) {
        return $http({
            url: baseURL + '/devices/' + uuid,
            method: 'GET',
            headers: {
                skynet_auth_uuid: uuid,
                skynet_auth_token: token
            },
            timeout : 5 * 1000
        });
    };

    obj.sendData = function (uuid, token, data) {
        return $http({
            url: baseURL + '/data/' + uuid,
            method: 'POST',
            params: data,
            headers: {
                skynet_auth_uuid: uuid,
                skynet_auth_token: token
            },
            timeout : 5 * 1000
        });
    };

    return obj;

});

skynetModel.service('OctobluRest', function ($http) {

    var obj = this,
        baseURL = 'http://app.octoblu.com';

    obj.getDevices = function (uuid, token) {

        return $http({
            url: baseURL + '/api/owner/devices/' + uuid + '/' + token,
            method: 'GET',
            timeout : 5 * 1000
        });

    };

    obj.getGateways = function (uuid, token, includeDevices) {

        return $http({
            url: baseURL + '/api/owner/gateways/' + uuid + '/' + token,
            method: 'GET',
            params: {
                devices: includeDevices
            },
            timeout : 5 * 1000
        });

    };

    obj.searchPlugins = function(term, callback){

        return $http({
            url: baseURL + '/api/devices/plugins/',
            method: 'GET',
            params: {
                keywords: term
            },
            timeout : 10 * 1000
        });
    };

    return obj;

});