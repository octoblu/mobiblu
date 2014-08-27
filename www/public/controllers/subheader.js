'use strict';

angular.module('main.system').controller('SubHeaderCtrl',
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

        $scope.claimDeviceBtn = false;

        $scope.showClaimDevice = function () {

            var type = navigator.connection.type;

            if (type === 'wifi') {
                $scope.claimDeviceBtn = true;
            }

        };

        $scope.showClaimDevice();
    });