'use strict';

angular.module('main.skynet')
  .service('Skynet', function ($rootScope, $q, Auth, $location, $timeout) {
    var loaded = false;

    var lib = window.Skynet;

		var _skynetInit = function () {
        var deferred = $q.defer();
        if ($rootScope.isErrorPage() && $rootScope.matchRoute('/login')) {
            deferred.reject();
        } else {
          Auth.getCurrentUser()
              .then(function (currentUser) {
                  var uuid, token;
                  if (currentUser && currentUser.skynet) {
                      uuid = currentUser.skynet.uuid;
                      token = currentUser.skynet.token;
                  }

                  lib.init(uuid, token)
                      .timeout(1000 * 15)
                      .then(function () {
                          console.log('_skynetInit successful');
                          $rootScope.clearAppTimeouts();
                          deferred.resolve();
                      }, function () {
                          console.log('Unable to connect to Meshblu');
                          $rootScope.redirectToError('Unable to connect to Meshblu');
                      });

            }, deferred.reject);

        }
        return deferred.promise;
    };

    var _skynetLoad = function () {

        var deferred = $q.defer();

        $(document).on('skynet-ready', function () {
            loaded = true;
            deferred.resolve();
        });

        return deferred.promise;
    };

    lib.ready = function (cb) {
    		var deferred = $q.defer();

    		function done(){
    			if(typeof cb === 'function'){
    				cb(lib.conn);
    			}
          deferred.resolve(lib.conn);
    		}

        $rootScope.setSettings();

        if (loaded || $rootScope.isErrorPage() || $rootScope.matchRoute('/login')) {
            done();
        } else {
            _skynetLoad().then(done, function (err) {
                $rootScope.redirectToError(err || 'Meshblu can\'t connect');
                deferred.reject();
            });
        }
        return deferred.promise;
    };

    var _startListen = function () {
      lib.conn.on('message', function (message) {

        $rootScope.$broadcast('skynet:message', message);

        var device = message.subdevice || message.fromUuid;

        $rootScope.$broadcast('skynet:message:' + device, message);
        if (message.payload && _.has(message.payload, 'online')) {
            device = _.findWhere($rootScope.myDevices, {uuid: message.fromUuid});
            if (device) {
                device.online = message.payload.online;
            }
        }

      });
    };

    lib.start = function () {
        $rootScope.loading = true;

				if(lib.hasAuth()){

            _skynetLoad();

            return _skynetInit()
              .then(function () {
                var deferred = $q.defer();

                $rootScope.setSettings();

                lib.conn = lib.getCurrentSettings().conn;

                if (lib.conn) {

                  console.log('SKYNET LOADED');
                  $(document).trigger('skynet-ready');
                  loaded = true;

                  _startListen();

                  deferred.resolve();

                }else{
                  deferred.reject();
                }

                $timeout(function(){

                  $rootScope.isAuthenticated();

                  $rootScope.loading = false;

                }, 0);


                return deferred.promise;

              }, function(){
                  console.log('Rejected _skynetInit();');
              });
        }else{
            $location.path('/login');
        }

    };

    return lib;

  });