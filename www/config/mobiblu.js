(function(global){
	'use strict';

	var env = 'production';

	var defaults = {
		APP_NAME : 'Mobiblu',
		LOCAL_URL : 'http://localhost/index.html#!'
	};

	var envs = {
		production : {
			OCTOBLU_URL : 'http://app.octoblu.com',
			SKYNET_URL : 'http://meshblu.octoblu.com',
			SKYNET_HOST : 'meshblu.octoblu.com',
			SKYNET_PORT : 80
		},
		staging : {
			OCTOBLU_URL : 'http://staging.octoblu.com',
			SKYNET_URL : 'http://staging.meshblu.octoblu.com',
			SKYNET_HOST : 'staging.meshblu.octoblu.com',
			SKYNET_PORT : 80
		},
		development : {
			OCTOBLU_URL : 'http://localhost:8080',
			SKYNET_URL : 'http://localhost:3000',
			SKYNET_HOST : 'localhost',
			SKYNET_PORT : 3000
		}
	};

	global.mobibluConfig = _.extend(defaults, envs[env]);

})(window);