'use strict';

angular.module('main.system')
  .service('Config', function($window) {
    var config;

    function setConfig(obj) {
      obj.envs = envs;
      obj.env = env;
      config = $window.mobibluConfig =  _.extend(obj, envs[env]);
    }

    var env = 'production';

    var storage = $window.localStorage.getItem('skynetuuid') ? $window.mobibluStorage : $window.localStorage;

    var obj = {
      APP_NAME: 'Mobiblu',
      LOCAL_URL: 'http://localhost/index.html#!'
    };

    var envs = {
      production: {
        OCTOBLU_URL: 'https://app.octoblu.com',
        SKYNET_URL: 'https://meshblu.octoblu.com',
        SKYNET_HOST: 'meshblu.octoblu.com',
        SKYNET_PORT: 80
      },
      staging: {
        OCTOBLU_URL: 'https://staging.octoblu.com',
        SKYNET_URL: 'https://meshblu-staging.octoblu.com',
        SKYNET_HOST: 'meshblu-staging.octoblu.com',
        SKYNET_PORT: 80
      },
      development: {
        OCTOBLU_URL: 'http://localhost:8080',
        SKYNET_URL: 'http://localhost:3000',
        SKYNET_HOST: 'localhost',
        SKYNET_PORT: 3000
      }
    };

    obj.setEnv = function(newEnv) {
      storage.setItem('environment', newEnv);
      env = newEnv;
      setConfig(obj);
    };

    obj.getEnv = function() {
      env = storage.getItem('environment');
      if (!env) {
        obj.setEnv('production');
      }
    };

    obj.getEnv();

    setConfig(obj);

    return config;

  });