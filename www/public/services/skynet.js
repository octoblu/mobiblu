'use strict';

angular.module('main.skynet')
  .service('Skynet', function($rootScope, $q, Auth, $location, $timeout) {
    var loaded = false;

    var lib = window.Skynet;

    var _init = function() {
      var deferred = $q.defer();
      if ($rootScope.isErrorPage() && $rootScope.matchRoute('/login')) {
        deferred.reject();
      } else {
        Auth.getCurrentUser()
          .then(function(currentUser) {
            var uuid, token;
            if (currentUser && currentUser.skynet) {
              uuid = currentUser.skynet.uuid;
              token = currentUser.skynet.token;
            }

            lib.init(uuid, token)
              .timeout(1000 * 15)
              .then(function() {
                console.log('_init successful');
                $rootScope.clearAppTimeouts();
                deferred.resolve();
              }, function() {
                console.log('Unable to connect to Meshblu');
                $rootScope.redirectToError('Unable to connect to Meshblu');
              });

          }, deferred.reject);

      }
      return deferred.promise;
    };

    var _start = function(){
      var deferred = $q.defer();

      $rootScope.setSettings();

      lib.conn = lib.getCurrentSettings().conn;

      if (lib.conn) {

        console.log('SKYNET LOADED');
        $(document).trigger('skynet-ready');
        loaded = true;

        _startListen();

        deferred.resolve();

      } else {
        deferred.reject();
      }

      $rootScope.isAuthenticated();

      $rootScope.loading = false;

      return deferred.promise;
    };

    var _skynetIsReady = function() {

      var deferred = $q.defer();

      $(document).on('skynet-ready', function() {
        loaded = true;
        deferred.resolve();
      });

      // We Start Here because the promises don't work after window.location.reload()
      $(document).on('skynet-loaded', function(){
          $timeout(function(){
            _start();
          }, 0);
      });

      return deferred.promise;
    };

    var _startListen = function() {
      lib.conn.on('message', function(message) {

        $rootScope.$broadcast('skynet:message', message);

        var device = message.subdevice || message.fromUuid;

        $rootScope.$broadcast('skynet:message:' + device, message);
        if (message.payload && _.has(message.payload, 'online')) {
          device = _.findWhere($rootScope.myDevices, {
            uuid: message.fromUuid
          });
          if (device) {
            device.online = message.payload.online;
          }
        }

      });
    };

    lib.ready = function(cb) {
      var deferred = $q.defer();

      function done() {
        if (typeof cb === 'function') {
          cb(lib.conn);
        }
        deferred.resolve(lib.conn);
      }

      $rootScope.setSettings();

      if (loaded || $rootScope.isErrorPage() || $rootScope.matchRoute('/login')) {
        done();
      } else {
        _skynetIsReady().then(done, function(err) {
          $rootScope.redirectToError(err || 'Meshblu can\'t connect');
          deferred.reject();
        });
      }
      return deferred.promise;
    };

    lib.start = function() {

      if (lib.hasAuth()) {
        $rootScope.loading = true;

        _skynetIsReady();

        return _init();
      } else {
        $rootScope.loading = false;
        $location.path('/login');
        var deferred = $q.defer();
        deferred.reject();
        return deferred.promise;
      }

    };

    return lib;

  });