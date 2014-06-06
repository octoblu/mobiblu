'use strict';

var pluginsApp = angular.module('main.plugins', ['hmTouchevents', 'SkynetModel', 'SensorModel']);

pluginsApp.controller('PluginCtrl', function ($scope) {

    if(/\#\!\/plugins\/*$/.test(window.location.href)){
        $(document).trigger('togglebackbtn', false);
    }else{
        $(document).trigger('togglebackbtn', true);
    }

    $scope.init = function(){

    };
});
