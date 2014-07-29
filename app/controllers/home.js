'use strict';

angular.module('main.home')
    .controller('HomeCtrl', function ($rootScope, $scope, $location, Auth) {

        $scope.init = function () {
            $rootScope.$emit('togglebackbtn', false);

            $rootScope.ready(function () {
                $rootScope.loading = false;
            });
            $rootScope.pluginReady(function () {
                $scope.subdevices = window.octobluMobile.getSubdevices();
            });
        };

        $scope.login = function(){
            Auth.login();
        };

        $scope.goToDevice = function (subdevice) {
            $location.path('/plugins/device/' + subdevice.type + '/' + subdevice.uuid + '/0');
        };

    });
