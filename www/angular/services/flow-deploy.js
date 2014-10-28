'use strict';

angular.module('main.octoblu')
  .service('FlowDeploy', function($http, $rootScope, Config) {

    var self = this,
      baseURL = Config.OCTOBLU_URL;

    self.controlFlow = function(command, flowId) {
    	var method;
    	switch(command){
    		case 'start':
    			method = 'POST';
    			break;
    		case 'stop':
    			method = 'DELETE';
    			break;
    		case 'restart':
    			method = 'PUT';
    			break;
    	}
    	console.log('Flow Control', method, flowId);
      return $http({
        url: baseURL + '/api/flows/' + flowId + '/instance',
        method: method,
        headers: {
          skynet_auth_uuid: $rootScope.skynetuuid,
          skynet_auth_token: $rootScope.skynettoken
        },
        timeout: 10 * 1000
      });
    };

    return self;

  });