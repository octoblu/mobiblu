'use strict';

var pluginsApp = angular.module('main.plugins', ['hmTouchevents', 'SkynetModel', 'SensorModel']);

pluginsApp.controller('PluginCtrl', function ($scope, $routeParams, $location) {

    if(/\#\!\/plugins\/*$/.test(window.location.href)){
        $(document).trigger('togglebackbtn', false);
    }else{
        $(document).trigger('togglebackbtn', true);
    }

    $scope.init = function(){

    };

    $scope.getPlugins = function(){
        $scope.plugins = window.octobluMobile.getPlugins();
    };

    $scope.installed = function(){
        $scope.getPlugins();
    };

    $scope.findOne = function(){
        $scope.getPlugins();
        for(var x in $scope.plugins){
            var plugin = $scope.plugins[x];
            if(plugin.name === $routeParams.pluginName){
                $scope.plugin = plugin;
                break;
            }
        }
    };

    $scope.toggleEnabled = function () {
        $scope.plugin.enabled = !$scope.plugin.enabled;
        window.octobluMobile.triggerPluginEvent(
            $scope.plugin,
            $scope.plugin.enabled ? 'onEnable' : 'onDisable',
            function(err, data){
                if(err) return console.log('Error enabling or disabling plugin', err);
                console.log('Data after enable or disable', JSON.stringify(data));
            }
        );
    };

    $scope.removePlugin = function(){
        window.octobluMobile.removePlugin(
            $scope.plugin,
            function(err){
                if(err) return console.log('Error removing plugin', err);
                console.log('Removed plugin');
                $location.path('/plugins');
            }
        );
    };
});
