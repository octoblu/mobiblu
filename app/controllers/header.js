'use strict';

angular.module('main.system').controller('HeaderCtrl',
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
            if (!$rootScope.loggedin) {
                $scope.showLogout = false;
                $scope.backbtn = false;
            }
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