'use strict';

angular.module('main.system').controller('HeaderCtrl',
    function ($rootScope, $scope, $location, Auth) {

        // TODO improve this functionality for multiple levels
        $scope.backbtn = false;
        $scope.showLogout = false;

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
            $scope.backbtn = false;
            $scope.showLogout = false;

            if($rootScope.matchRoute('/$')){
                $scope.backbtn = false;
                $scope.showLogout = false;
            } else if ($rootScope.matchRoute('/setting')) {
                $scope.showLogout = true;
                $scope.backbtn = true;
            } else if(!$rootScope.matchRoute('/\\w+$')) {
                $scope.backbtn = true;
            }
        });

        $scope.init = function () {

        };

    });