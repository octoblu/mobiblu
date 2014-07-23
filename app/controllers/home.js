'use strict';

angular.module('main.home')
    .controller('HomeCtrl', function ($rootScope, $scope, $location) {

        $scope.init = function () {
            $scope.login = $rootScope.Skynet.login;
            $rootScope.ready(function () {
                $rootScope.loading = false;
            });
            $rootScope.pluginReady(function () {
                $scope.subdevices = window.octobluMobile.getSubdevices();
            });
        };

        $scope.goToDevice = function (subdevice) {
            $location.path('/plugins/device/' + subdevice.type + '/' + subdevice._id + '/0');
        };

    });
