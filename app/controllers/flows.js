'use strict';

var flowsApp = angular.module('main.flows', ['hmTouchevents', 'SkynetModel', 'SensorModel']);

flowsApp.controller('FlowCtrl', function ($scope, $routeParams, $location) {

    if(/\#\!\/flows\/*$/.test(window.location.href)){
        $(document).trigger('togglebackbtn', false);
    }else{
        $(document).trigger('togglebackbtn', true);
    }

    $scope.init = function(){

    };
});
