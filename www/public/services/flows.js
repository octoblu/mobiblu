'use strict';

angular.module('main.flows')
    .service('Flows', function($http, $q, $rootScope, Config){
        var self = this,
    		baseURL = Config.OCTOBLU_URL;

        self.testGetFlows = function(){
            return $http.get('/data/test_flows.json');
        };

        self.getFlows = function(){
        	return $http({
                url: baseURL + '/api/flows/',
                method: 'GET',
                headers: {
                    skynet_auth_uuid: $rootScope.skynetuuid,
                    skynet_auth_token: $rootScope.skynettoken
                }
            });
        };

        return self;
    });