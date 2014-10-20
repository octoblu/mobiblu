'use strict';

angular.module('main.user')
  .controller('UserCtrl', function($rootScope, $scope, $location, $window, $timeout, Utils, Auth, Config, Skynet) {

    $scope.signup = false;

    $scope.user = {};

    $scope.init = function() {
      $scope.error = '';
      $rootScope.clearAppTimeouts();
    };

    function redirectAndReload() {
      $rootScope.$on('$locationChangeSuccess', function() {
        console.log('Reloading app (in user.js)');
        $window.location.reload(true);
      });
      $timeout(function() {
        $location.path('/');
      }, 0);
    }

    $scope.loginViaProvider = function(provider, old) {
      $rootScope.loading = true;
      var url = Config.OCTOBLU_URL;
      if (old) {
        url += '/auth/' + provider;
      } else {
        url += '/api/oauth/' + provider;
      }
      url += '?mobile=true&referrer=' + encodeURIComponent(Config.LOCAL_URL + 'login');
      var authWindow = $window.open(url, '_blank', 'location=no,toolbar=yes,closebuttoncaption=Cancel');

      function exit() {
        authWindow.removeEventListener('loadstart', loadStart);
       	authWindow.removeEventListener('exit', exit);
      }

      function loadStart(e) {
        var url  = e.url;
        var uuid = /\?uuid=(.+)$/.exec(url);

        console.log('Auth window loading url : ', e, url);

        if (uuid) {
          var newskynetuuid  = Utils.getParam('uuid', url),
              newskynettoken = Utils.getParam('token', url);

          if (newskynetuuid === 'undefined') {
            newskynetuuid = null;
          }
          if (newskynettoken === 'undefined') {
            newskynettoken = null;
          }
          // Set new Skynet Tokens
          if (newskynetuuid && newskynettoken) {
            console.log('Setting new credentials');
            Skynet.login(newskynetuuid, newskynettoken);
            redirectAndReload();
          	exit();
          } else {
            console.log('No Credentials Backup' + JSON.stringify([newskynetuuid, newskynettoken]));
            authWindow.close();
            $window.location = '/error.html';
            return;
          }


        }
      }
      authWindow.addEventListener('loadstart', loadStart);
      authWindow.addEventListener('exit', exit);
    };

    $scope.loginMethod = function() {
      $rootScope.loading = true;
      Auth.login($scope.user.email, $scope.user.password)
        .then(redirectAndReload, function(err) {
          console.log('Error', err);
          $scope.error = 'Error logging in!';
          $rootScope.loading = false;
        });
    };

    $scope.signupMethod = function() {

      console.log('Signup Method');

      if (!$scope.user.password || !$scope.user.password.length) {
        $scope.error = 'Must have password';
        console.log($scope.error);
        return;
      }

      if (!$scope.user.email || !$scope.user.email.length) {
        $scope.error = 'Must have email';
        console.log($scope.error);
        return;
      }

      if ($scope.user.confirm_password !== $scope.user.password) {
        $scope.error = 'Passwords Don\'t Match';
        console.log($scope.error);
        return;
      }

      $scope.loading = true;

      Auth.signup($scope.user.email, $scope.user.password)
        .then(redirectAndReload, function(err) {
          console.log('Error', err);
          $scope.error = 'Error logging in!';
        });
    };

    $scope.hideSignup = function() {
      $scope.signup = false;
    };

    $scope.showSignup = function() {
      $scope.signup = true;
    };

    $scope.acceptTerms = function() {
      Auth.acceptTerms()
        .then(function() {
          $location.path('/');
        }, function() {
          alert('Error');
        });
    };

    $scope.getTerms = function() {
      $('#terms')
        .load(Config.OCTOBLU_URL + '/pages/terms.html', function() {

          var imgs = $('#terms img');
          imgs.each(function() {
            var src = $(this).attr('src');
            $(this).attr('src', Config.OCTOBLU_URL + src);
          });

        });
    };

  });