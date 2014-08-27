'use strict';

angular.module('main.system').controller('FooterCtrl',
    function ($rootScope, $scope) {

        $scope.isActive = function (route) {
            if (route === '/') {
                route += '$'; // Make sure regex finds the end
            }
            return $rootScope.matchRoute(route);
        };

    });