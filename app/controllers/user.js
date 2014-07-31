'use strict';

angular.module('main.user')
    .controller('UserCtrl', function ($rootScope, $scope, $location, $timeout, Auth) {

        $scope.signup = false;

        $scope.user = {};

        $scope.init = function () {
            $scope.error = '';
        };

        $scope.loginViaProvider = function (provider) {
            var authWindow = window.open('http://app.octoblu.com/auth/' + provider + '?js=1&mobile=true&referrer=' + encodeURIComponent('http://localhost/index.html#!/login'), '_blank', 'location=no,toolbar=no');

            $(authWindow).on('loadstart', function (e) {
                var url = e.originalEvent.url;
                var uuid = /\?uuid=(.+)$/.exec(url);

                console.log('Auth window loading url : ', url);

                if (uuid) {
                    authWindow.close();
                    var newskynetuuid = getParam('uuid', url),
                        newskynettoken = getParam('token', url),
                        skynetuuid = window.localStorage.getItem('skynetuuid'),
                        skynettoken = window.localStorage.getItem('skynettoken');

                    var invalidLogin = false;
                    if (newskynetuuid === 'undefined') {
                        newskynetuuid = null;
                        invalidLogin = true;
                    }
                    if (newskynettoken === 'undefined') {
                        newskynettoken = null;
                        invalidLogin = true;
                    }

                    console.log('Skynet UUID: ' + skynetuuid);
                    console.log('Skynet Token: ' + skynettoken);
                    console.log('NEW Skynet UUID: ' + newskynetuuid);
                    console.log('NEW Skynet Token: ' + newskynettoken);
                    // Set new Skynet Tokens
                    if (newskynetuuid && newskynettoken) {
                        console.log('Setting new credentials');
                        // If user changed then do delete the mobileuuid && mobiletoken
                        if (skynetuuid && skynetuuid !== newskynetuuid) {
                            console.log('Setting new mobile credentials');
                            window.localStorage.removeItem("mobileuuid");
                            window.localStorage.removeItem("mobiletoken");
                        }
                        window.localStorage.setItem("skynetuuid", newskynetuuid);
                        window.localStorage.setItem("skynettoken", newskynettoken);
                        window.localStorage.setItem('loggedin', true);

                        $rootScope.loggedin = true;
                        $rootScope.Skynet.login(newskynetuuid, newskynettoken);
                    } else if (invalidLogin || ( !newskynetuuid && !newskynettoken )) {
                        console.log('No Credentials' + JSON.stringify([newskynetuuid, newskynettoken]));
                        window.location = 'error.html';
                        window.location = 'error.html';
                        return;
                    } else {
                        console.log('No Credentials' + JSON.stringify([newskynetuuid, newskynettoken]));
                        window.location = 'error.html';
                        return;
                    }

                    console.log('About to Re-initialize skynet');

                    $rootScope.setSettings();

                    $rootScope.skynetInit()
                        .then(function () {
                            console.log('Skynet INIT\'d after login');
                            $location.path('/');
                        });
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
                    $rootScope.skynetInit()
                        .then(function () {
                            afterLogin();
                        });


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
                    $rootScope.skynetInit()
                        .then(function () {
                            afterLogin();
                        });
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
