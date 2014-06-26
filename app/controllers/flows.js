'use strict';

var flowsApp = angular.module('main.flows', ['hmTouchevents', 'SkynetModel']);

flowsApp.controller('FlowCtrl', function ($rootScope, $scope) {

    if(/\#\!\/flows\/*$/.test(window.location.href)){
        $rootScope.$emit('togglebackbtn', false);
    }else{
        $rootScope.$emit('togglebackbtn', true);
    }

    $scope.init = function(){

    };


});
