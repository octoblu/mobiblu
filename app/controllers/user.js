'use strict';

angular.module('main.user')
    .controller('UserCtrl', function ($rootScope, $scope, $location, $timeout, Auth) {

        $scope.signup = false;

        $scope.user = {};

        $scope.init = function () {
            $scope.error = '';
        };

        $scope.loginViaProvider = function (provider) {
            $rootScope.loading = true;
            var authWindow = window.open('http://app.octoblu.com/auth/' + provider + '?js=1&mobile=true&referrer=' + encodeURIComponent('http://localhost/index.html#!/login'), '_blank', 'location=no,toolbar=no');

            $(authWindow).on('loadstart', function (e) {
                var url = e.originalEvent.url;
                var uuid = /\?uuid=(.+)$/.exec(url);

                console.log('Auth window loading url : ', url);

                if (uuid) {
                    authWindow.close();
                    var newskynetuuid = utils.getParam('uuid', url),
                        newskynettoken = utils.getParam('token', url),
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
                        $rootScope.Skynet.login(newskynetuuid, newskynettoken);
                    } else {
                        console.log('No Credentials Backup' + JSON.stringify([newskynetuuid, newskynettoken]));
                        window.location = 'error.html';
                        return;
                    }

                    // If enabled this will slow down the process but properly re-establish the connections
                    var forceRestart = true;

                    $timeout(function(){
                        $rootScope.$on('$locationChangeSuccess', function () {
                            $rootScope.loading = false;

                            if (forceRestart) {

                                console.log('Reloading app (in user.js)');

                                window.location.reload(true);

                            } else {

                                console.log('About to Re-initialize skynet');

                                $rootScope.skynetInit()
                                    .then(function () {
                                        console.log('Skynet INIT\'d after login');
                                        $location.path('/');
                                    });
                            }
                        });

                        $location.path('/');

                    }, 0);

                }

            });
        };

        function afterLogin() {
            Auth.checkTerms().then(function () {
                console.log('Terms Accepted');

                $timeout(function () {
                    $rootScope.setSettings();

                    $rootScope.loading = false;
                    $location.path('/');
                }, 0);

            }, function () {
                console.log('Terms not Accepted');
                $timeout(function () {
                    $rootScope.loading = false;
                    $location.path('/accept_terms');
                }, 0);
            });

        }

        $scope.loginMethod = function () {
            $rootScope.loading = true;
            Auth.login($scope.user.email, $scope.user.password)
                .then(function () {
                    console.log('Logged In');

                    window.location.reload(true);

                }, function (err) {
                    console.log('Error', err);
                    $timeout(function () {
                        $scope.error = 'Error logging in!';
                        $rootScope.loading = false;
                    }, 0);
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
                .then(function () {
                    console.log('Signed up');
                    $scope.error = '';

                    window.location.reload(true);

                }, function (err) {
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
                .load('http://app.octoblu.com/pages/terms.html', function () {

                    var imgs = $('#terms img');
                    imgs.each(function () {
                        var src = $(this).attr('src');
                        $(this).attr('src', 'https://app.octoblu.com/' + src);
                    });

                });
        }

    });
