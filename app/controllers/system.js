'use strict';

var systemApp = angular.module('main.system', ['SkynetModel']);

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
    function ($rootScope, $scope, $location) {

        // TODO improve this functionality for multiple levels
        $scope.backbtn = false;

        $rootScope.$on('togglebackbtn', function (e, val) {
            $scope.backbtn = val;
        });

        $scope.goBack = function () {
            window.history.back();
        };

        $scope.logout = function () {
            $rootScope.Skynet.logout();
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
    function ($rootScope, $scope) {

        $scope.errors = [];

        $rootScope.$emit('togglebackbtn', true);

        $scope.activities = [];

        var setActivity = function () {
            $scope.$apply(function () {
                $scope.activities = $rootScope.Skynet.getActivity();
            });
        };

        $scope.init = function () {
            $rootScope.ready(function () {
                $rootScope.Skynet.clearActivityCount();
                $scope.activities = $rootScope.Skynet.getActivity();
                $(document).on('skynetactivity', function () {
                    setActivity();
                });
            });
        };

    });

systemApp.controller('ErrorCtrl',
    function ($rootScope, $scope) {

        $scope.init = function () {
            if(!$rootScope.errorMsg){
                return $rootScope.errorMsg = '';
            }
            if(typeof $rootScope.errorMsg !== 'string'){
                $rootScope.errorMsg = $rootScope.errorMsg.toString();
            }
        };

        $scope.logout = function () {
            $rootScope.Skynet.logout();
        };

    });
