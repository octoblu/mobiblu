angular.module('main.octoblu')
    .service('OctobluRest', function ($http) {

        var self = this,
            baseURL = 'http://app.octoblu.com';

        self.getDevices = function (uuid, token) {

            return $http({
                url: baseURL + '/api/devices/',
                method: 'GET',
                timeout: 5 * 1000,
                headers: {
                    skynet_auth_uuid: uuid,
                    skynet_auth_token: token
                }
            });

        };

        self.getGateways = function (uuid, token, includeDevices) {

            return $http({
                url: baseURL + '/api/owner/gateways/' + uuid + '/' + token,
                method: 'GET',
                params: {
                    devices: includeDevices
                },
                timeout: 5 * 1000
            });

        };

        self.searchPlugins = function (term, callback) {

            return $http({
                url: baseURL + '/api/devices/plugins/',
                method: 'GET',
                params: {
                    keywords: term
                },
                timeout: 10 * 1000
            });
        };

        return self;

    });