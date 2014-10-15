'use strict';

angular.module('main.home')
    .controller('HomeCtrl', function ($rootScope, $scope, $location, Auth, Plugins, Subdevices) {

        $scope.init = function () {
            Plugins.ready().then(function () {
                $scope.subdevices = Subdevices.retrieve();
            });
        };

        $scope.login = function(){
            Auth.login();
        };

        $scope.goToDevice = function (subdevice) {
            $location.path('/plugins/device/' + subdevice.type + '/' + subdevice.uuid + '/0');
        };

    });
