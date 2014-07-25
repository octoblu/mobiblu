'use strict';

var systemApp = angular.module('main.system');

systemApp.controller('SubHeaderCtrl',
    function ($rootScope, $scope) {
        $scope.activity = true;

        $scope.showActivity = function () {
            var excludes = [
                '/login$'
            ];
            for (var x in excludes) {
                var exclude = excludes[x];
                if ($rootScope.matchRoute(exclude)) {
                    $scope.activity = false;
                    return false;
                }
            }

            $scope.activity = true;
            return true;
        };

        $scope.showActivity();

    });

systemApp.controller('HeaderCtrl',
    function ($rootScope, $scope, $location, Auth) {

        // TODO improve this functionality for multiple levels
        $scope.backbtn = false;

        $rootScope.$on('togglebackbtn', function (e, val) {
            if ($rootScope.matchRoute('/$')) {
                $scope.backbtn = false;
            } else {
                $scope.backbtn = val;
            }
        });

        $scope.goBack = function () {
            window.history.back();
        };

        $scope.logout = function () {
            Auth.logout()
                .then(function () {
                    $location.path('/login');
                });
        };

        $scope.settings = function () {
            $location.path('/setting');
        };

        $scope.$on('$locationChangeSuccess', function () {
            if ($rootScope.matchRoute('/setting')) {
                $scope.showLogout = true;
            } else {
                $scope.showLogout = false;
            }
            if ($rootScope.matchRoute('/$')) {
                $scope.backbtn = false;
            }
        });

        $scope.showLogout = false;

        $scope.init = function () {

        };

    });


systemApp.controller('FooterCtrl',
    function ($rootScope, $scope) {
        $scope.init = function () {
            $rootScope.ready(function () {
                if (!$rootScope.isAuthenticated()) {
                    $scope.disabled = true;
                    return;
                }
            });
        };

        $scope.isActive = function (route) {
            if (route === '/') {
                route += '$'; // Make sure regex finds the end
            }
            return $rootScope.matchRoute(route);
        };

    });

systemApp.controller('ActivityCtrl',
    function ($rootScope, $scope, $routeParams) {

        $scope.errors = [];

        $rootScope.$emit('togglebackbtn', true);

        $scope.activities = [];

        $scope.limit = 25;

        var setActivity = function () {
            setTimeout(function () {
                $scope.$apply(function () {
                    $scope.activities = $rootScope.Skynet.getActivity($routeParams.pluginName, $scope.limit);
                });
            }, 0);
        };

        $scope.init = function () {
            if ($rootScope.matchRoute('/$')) {
                $scope.limit = 5;
            } else if ($rootScope.matchRoute('/plugins')) {
                $scope.limit = 10;
            }
            $rootScope.ready(function () {
                $rootScope.Skynet.clearActivityCount();
                $scope.activities = $rootScope.Skynet.getActivity($routeParams.pluginName, $scope.limit);
                $(document).on('skynetactivity', function () {
                    setActivity();
                });
            });
        };

    });

systemApp.controller('ErrorCtrl',
    function ($rootScope, $scope) {

        $scope.init = function () {
            console.log('On Error Page');
            if (!$rootScope.errorMsg) {
                return $rootScope.errorMsg = '';
            }
            if (typeof $rootScope.errorMsg !== 'string') {
                $rootScope.errorMsg = $rootScope.errorMsg.toString();
            }
        };

        $scope.logout = function () {
            window.Skynet.logout();
        };

    });
