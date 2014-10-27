'use strict';

angular.module('main.user')
  .service('Auth', function($q, $http, $window, $rootScope, Config) {
    var currentUser = {},
      baseUrl = Config.OCTOBLU_URL,
      service;

    function getCurrentUser(force) {
      var deferred = $q.defer();
      console.log('Getting User');
      if (currentUser.id && !force) {
        deferred.resolve(currentUser);
      } else {
        var uuid = $rootScope.skynetuuid;
        var token = $rootScope.skynettoken;
        var req = {
          url: baseUrl + '/api/auth',
          method: 'GET',
          timeout: 15 * 1000
        };
        console.log('Set Data Creds in Auth.js : ' + JSON.stringify([uuid, token]));
        if (uuid && token) {
          req.headers = {
            skynet_auth_uuid: uuid,
            skynet_auth_token: token
          };

          return $http(req)
            .then(function(result) {
              var deferred = $q.defer();
              loginHandler(result);
              deferred.resolve(result.data);
              return deferred.promise;
            }, function(err) {
              var deferred = $q.defer();
              logoutHandler(err);
              deferred.reject();
              return deferred.promise;
            });
        } else {
          deferred.reject();
        }

      }
      return deferred.promise;
    }

    function processCurrentUser(data) {
      angular.copy(data, currentUser);

      try{
        $window.localStorage.setItem('skynetuuid', currentUser.skynet.uuid);
        $window.localStorage.setItem('skynettoken', currentUser.skynet.token);
      }catch(e){}

      $window.localStorage.setItem('loggedin', 'true');

      $rootScope.loggedin = $window.loggedin = true;

      return currentUser;
    }

    function loginHandler(result) {
      if (!result || result.status >= 400) {
        logoutHandler();
        if (result) {
          throw result.data;
        } else {
          console.log('Result', JSON.stringify(result));
          return {};
        }
      }

      return processCurrentUser(result.data);
    }

    function logoutHandler(err) {
      console.log('IN LOGOUT HANDLER :: ' + err);
      angular.copy({}, currentUser);

      window.localStorage.removeItem('loggedin');
      window.localStorage.removeItem('skynetuuid');
      window.localStorage.removeItem('skynettoken');

      $rootScope.loggedin = $window.loggedin = false;

      $rootScope.setSettings();
    }

    return {
      acceptTerms: function() {
        return $http({
          url: baseUrl + '/api/auth/accept_terms',
          method: 'PUT',
          headers: {
            skynet_auth_uuid: $rootScope.skynetuuid,
            skynet_auth_token: $rootScope.skynettoken
          },
          data: {
            accept_terms: true
          }
        }).then(function(response) {
          if (response.status !== 204) {
            $rootScope.redirectToError(response.data);
          }
          return getCurrentUser();
        }, $rootScope.redirectToError);
      },
      checkTerms: function() {
        return $http({
          url: baseUrl + '/api/user/terms_accepted',
          method: 'GET',
          headers: {
            skynet_auth_uuid: $rootScope.skynetuuid,
            skynet_auth_token: $rootScope.skynettoken
          }
        }).then(function(response) {
          var deferred = $q.defer();

          if (response.status !== 204) {
            deferred.reject();
          } else {
            deferred.resolve();
          }
          return deferred.promise;
        }, $rootScope.redirectToError);
      },
      login: function(email, password) {
        return $http.post(baseUrl + '/api/auth', {
          email: email,
          password: password
        }).then(loginHandler, $rootScope.redirectToError);
      },

      signup: function(email, password) {
        return $http.post(baseUrl + '/api/auth/signup', {
          email: email,
          password: password
        }).then(loginHandler, $rootScope.redirectToError);
      },

      logout: function() {
        return $http({
          url: baseUrl + '/api/auth',
          method: 'DELETE',
          headers: {
            skynet_auth_uuid: $rootScope.skynetuuid,
            skynet_auth_token: $rootScope.skynettoken
          }
        }).finally(logoutHandler);
      },

      getCurrentUser: getCurrentUser
    };
  });