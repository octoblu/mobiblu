'use strict';

angular.module('main.flows')
    .service('Topic', function($http, Config){
        var self = this,
        		baseURL = Config.OCTOBLU_URL;

        self.retrieve = function(){
        	return $http({
                url: baseURL + '/api/devices/plugins/',
                method: 'GET',
                params: {
                    keywords: term
                },
                headers: {
                    skynet_auth_uuid: $rootScope.settings.skynetuuid,
                    skynet_auth_token: $rootScope.settings.skynettoken
                },
                timeout: 10 * 1000
            });
        };

        return self;
    });