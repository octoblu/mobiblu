'use strict';

angular.module('main.user')
    .controller('UserCtrl', function ($rootScope, $scope, $location, $window, $timeout, Utils, Auth, Config, Skynet) {

        $scope.signup = false;

        $scope.user = {};

        $scope.init = function () {
            $scope.error = '';
        };

        function redirectAndReload(){
            $rootScope.$on('$locationChangeSuccess', function () {
                $rootScope.loading = false;

                console.log('Reloading app (in user.js)');

                $window.location.reload(true);
            });
            $timeout(function(){
                $location.path('/');
            }, 0);
        }

        $scope.loginViaProvider = function (provider, old) {
            $rootScope.loading = true;
            var url = Config.OCTOBLU_URL;
            if(old){
                url += '/auth/' + provider;
            }else{
                url += '/api/oauth/' + provider;
            }
            url += '?mobile=true&referrer=' + encodeURIComponent(Config.LOCAL_URL + '/login');
            var authWindow = window.open(url, '_blank', 'location=no,toolbar=no');

            $(authWindow).on('loadstart', function (e) {
                var url = e.originalEvent.url;
                var uuid = /\?uuid=(.+)$/.exec(url);

                console.log('Auth window loading url : ', url);

                if (uuid) {
                    var newskynetuuid = Utils.getParam('uuid', url),
                        newskynettoken = Utils.getParam('token', url),
                        skynetuuid = window.localStorage.getItem('skynetuuid'),
                        skynettoken = window.localStorage.getItem('skynettoken');

                    if (newskynetuuid === 'undefined') {
                        newskynetuuid = null;
                    }
                    if (newskynettoken === 'undefined') {
                        newskynettoken = null;
                    }

                    console.log('Skynet UUID: ' + skynetuuid);
                    console.log('Skynet Token: ' + skynettoken);
                    console.log('NEW Skynet UUID: ' + newskynetuuid);
                    console.log('NEW Skynet Token: ' + newskynettoken);
                        // Set new Skynet Tokens
                    if (newskynetuuid && newskynettoken) {
                        console.log('Setting new credentials');

                        window.localStorage.setItem('skynetuuid', newskynetuuid);
                        window.localStorage.setItem('skynettoken', newskynettoken);
                        window.localStorage.setItem('loggedin', true);

                        $rootScope.loggedin = true;

                        Skynet.login(newskynetuuid, newskynettoken);
                    } else {
                        console.log('No Credentials Backup' + JSON.stringify([newskynetuuid, newskynettoken]));
                        window.location = '/error.html';
                        return;
                    }

                    redirectAndReload();

                    authWindow.close();
                }

            });
        };

        $scope.loginMethod = function () {
            $rootScope.loading = true;
            Auth.login($scope.user.email, $scope.user.password)
                .then(redirectAndReload, function (err) {
                    console.log('Error', err);
                    $scope.error = 'Error logging in!';
                    $rootScope.loading = false;
                });
        };

        $scope.signupMethod = function () {

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
                .then(redirectAndReload, function (err) {
                    console.log('Error', err);
                    $scope.error = 'Error logging in!';
                });
        };

        $scope.hideSignup = function () {
            $scope.signup = false;
        };

        $scope.showSignup = function () {
            $scope.signup = true;
        };

        $scope.acceptTerms = function () {
            Auth.acceptTerms()
                .then(function () {
                    $location.path('/');
                }, function () {
                    alert('Error');
                });
        };

        $scope.getTerms = function () {
            $('#terms')
                .load(Config.OCTOBLU_URL + '/pages/terms.html', function () {

                    var imgs = $('#terms img');
                    imgs.each(function () {
                        var src = $(this).attr('src');
                        $(this).attr('src', Config.OCTOBLU_URL + src);
                    });

                });
        };

    });