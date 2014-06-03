(function(global, octo, Skynet, messenger){
    'use strict';

    var obj = this;

    obj.plugins = [];

    // Utilities
    obj.each = function(cb){
        obj.plugins.forEach(cb);
    };

    obj.loadPluginJSON = function(name, callback){
        var dir = '/plugins/modules/' + name;
        $.get(dir + '/plugin.json', callback);
    };

    // Retrieve Plugins from Storage
    obj.retrievePlugins = function(){
        var plugins = [];

        try{

            // This loaded an array of the available plugin's plugin.json file
            var pluginsJSON = global.localStorage.getItem('plugins');

            if(pluginsJSON && pluginsJSON.length){
                plugins = JSON.parse(pluginsJSON);
            }

        }catch(e){
            alert('Error Reading Plugins');
            return false;
        }

        //if(!plugins.length){

        //}

        obj.plugins = plugins.map(function(plugin){
            var p;
            if(octo.plugins[plugin.name]){
                p = octo.plugins[plugin.name];
            }
            return p ? obj.initPlugin(p, plugin.enabled) : null;
        });

        // Update Devices
        Skynet.updateDeviceSetting({
            plugins : plugins
        }, function(){

        });

        return true;
    };

    // Individual Plugin Object
    obj.initPlugin = function(plugin, enabled){

        // Call Load
        if(enabled) {
            return plugin.Plugin(messenger);
        }
        return null;

    };

    // Called Every Time the App is initilized
    obj.init = function(){
        var loaded = obj.retrievePlugins();
        if(!loaded) return false;
    };

    var api = {
        logActivity : obj.logActivity
    };

    octo.init = obj.init;

    octo.api = api;

})(window, window.octobluMobile || {}, window.Skynet, window.messenger);
