'use strict';

var homeApp = angular.module('main.home', ['HomeModel', 'hmTouchevents', 'SkynetModel', 'SensorModel']);

homeApp.controller('HomeCtrl', function ($scope, $filter, HomeRestangular, Skynet) {

    Skynet.init(function () {});

    $scope.login = Skynet.login;
});
