'use strict';

var homeApp = angular.module('main.home', ['hmTouchevents', 'SkynetModel']);

homeApp.controller('HomeCtrl', function ($rootScope, $scope) {


    $scope.init = function(){
        $scope.login = $rootScope.Skynet.login;
        $rootScope.ready(function(){
            $rootScope.loading = false;
            $rootScope.$emit('togglebackbtn', false);
            $rootScope.$emit('toggleerrors', true);
        });
    };


});
