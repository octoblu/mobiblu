'use strict';
angular.module('main.plugins').
    service('GatebluPlugins', function ($q, $http, Skynet, Config, Device) {

        this.getDefaultOptions = function (hub, pluginName) {
            return Device.gatewayConfig({
                uuid: hub.uuid,
                token: hub.token,
                method: "getDefaultOptions",
                name: pluginName
            });
        };

        this.getSkynetPlugins = function(){
            return $http.get('/api/plugins').then(function(result){
                return result.data;
            });
        };

        this.getSkynetPlugin = function(pluginName){
            return $http({
                url: Config.OCTOBLU_URL + '/api/plugins/' + pluginName,
                method: 'GET',
                timeout: 5 * 1000,
                headers: {
                    skynet_auth_uuid: Skynet.skynetuuid,
                    skynet_auth_token: Skynet.skynettoken
                }
            }).then(function(result){
                return result.data;
            });
        };

        this.getPluginDefaultOptions = function(pluginName){
            return $http({
                url: Config.OCTOBLU_URL + '/api/plugins/' + pluginName + '/defaultoptions',
                method: 'GET',
                timeout: 5 * 1000,
                headers: {
                    skynet_auth_uuid: Skynet.skynetuuid,
                    skynet_auth_token: Skynet.skynettoken
                }
            }).then(function(result){
                return result.data;
            });
        };

        this.getInstalledPlugins = function (hub) {
            return Device.gatewayConfig({
                uuid: hub.uuid,
                token: hub.token,
                method: "getPlugins"
            });
        };

        this.getOrInstallPlugin = function(hub, pluginName){
            var _this = this;

            return _this.getInstalledPlugins(hub).then(function(result){
                var plugin = _.findWhere(result.result, {name: pluginName});

                if(plugin){
                    return plugin;
                }

                return _this.installAndReturnPlugin(hub, pluginName);
            });
        };

        this.installPlugin = function (hub, pluginName) {
            return Device.gatewayConfig({
                uuid: hub.uuid,
                token: hub.token,
                method: "installPlugin",
                name : pluginName
            });
        };

        this.installAndReturnPlugin = function(hub, pluginName){
            var _this = this;

            return this.installPlugin(hub, pluginName).then(function(){
                return _this.waitForPlugin(hub, pluginName);
            });
        };

        this.uninstallPlugin = function(hub, pluginName){
            return Device.gatewayConfig({
                "uuid": hub.uuid,
                "token": hub.token,
                "method": "uninstallPlugin",
                "name": pluginName
            });
        };

        this.waitForPlugin = function(hub, pluginName){
            var _this = this;

            return _this.getInstalledPlugins(hub).then(function(result){
                var defer, plugin;

                plugin = _.findWhere(result.result, {name: pluginName});
                defer = $q.defer();

                if(plugin){
                    return plugin;
                }

                _.delay(function(){
                    defer.resolve(_this.waitForPlugin(hub, pluginName));
                }, 1000);

                return defer.promise;
            });
        };

        this.getAvailablePlugins = function(){
            return $http({
                url: Config.OCTOBLU_URL + '/api/device/plugins',
                method: 'GET',
                timeout: 5 * 1000,
                headers: {
                    skynet_auth_uuid: Skynet.skynetuuid,
                    skynet_auth_token: Skynet.skynettoken
                }
            }).then(function(result){
                return result.data;
            });
        };
    });

