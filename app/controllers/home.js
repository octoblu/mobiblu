'use strict';

var homeApp = angular.module('main.home', ['hmTouchevents', 'SkynetModel']);

homeApp.controller('HomeCtrl', function ($rootScope, $scope) {


    $scope.init = function(){
        $rootScope.ready(function(){
            $scope.login = $rootScope.Skynet.login;
            $rootScope.loading = false;
            $rootScope.$emit('togglebackbtn', false);
            $rootScope.$emit('toggleerrors', true);
        });
    };


});
