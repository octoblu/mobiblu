'use strict';

var homeApp = angular.module('main.home', ['hmTouchevents', 'SkynetModel']);

homeApp.controller('HomeCtrl', function ($rootScope, $scope) {
    $rootScope.$emit('togglebackbtn', false);
    $rootScope.$emit('toggleerrors', true);

    $scope.init = function(){
        $rootScope.ready(function(){
            $scope.login = $rootScope.Skynet.login;
        });
    };


});
