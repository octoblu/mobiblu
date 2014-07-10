'use strict';

var homeApp = angular.module('main.home', ['hmTouchevents', 'SkynetModel']);

homeApp.controller('HomeCtrl', function ($rootScope, $scope, $location) {


    $scope.init = function(){
        $scope.login = $rootScope.Skynet.login;
        $rootScope.ready(function(){
            $rootScope.loading = false;
            $rootScope.$emit('togglebackbtn', false);
            $rootScope.$emit('toggleerrors', true);
        });
        $rootScope.pluginReady(function () {
            $scope.subdevices = window.octobluMobile.getSubdevices();
            console.log('Home Subdevices :: ' + JSON.stringify($scope.subdevices));
        });
    };

    $scope.goToDevice = function(subdevice){
        $location.path('/plugins/device/' + subdevice.type + '/' + subdevice._id);
    };

});
