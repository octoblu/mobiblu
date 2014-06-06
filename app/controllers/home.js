'use strict';

var homeApp = angular.module('main.home', ['hmTouchevents', 'SkynetModel', 'SensorModel']);

homeApp.controller('HomeCtrl', function ($scope, $filter, Skynet) {

    $(document).trigger('togglebackbtn', false);
    $(document).trigger('toggleerrors', true);

    Skynet.init(function () {});

    $scope.login = Skynet.login;
});
