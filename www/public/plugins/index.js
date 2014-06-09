window.octobluMobile = (function(global){
    //'use strict';

    var obj = this;

    obj.Skynet = global.Skynet;
    obj.Messenger = global.Messenger;

    obj.allPlugins = {};

    obj.pluginsJSON = false;

    obj.pluginsDir = '/public/plugins/modules/';

    function loadScript(url, callback){
        // Adding the script tag to the head as suggested before
        var head = document.getElementsByTagName('head')[0];
        var script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = url;

        // Then bind the event to the callback function.
        // There are several events for cross browser compatibility.
        script.onreadystatechange = callback;
        script.onload = callback;

        // Fire the loading
        head.appendChild(script);
    }

    // Utilities
    obj.each = function(cb){
        obj.allPlugins.forEach(cb);
    };

    obj.writePlugin = function(json){
        console.log('Writing Plugin', json.name);

        var plugins = obj.getPlugins();

        var found = -1;

        for(var x in plugins){
            var plugin = plugins[x];
            if(!plugin) continue;
            if(plugin.name === json.name){
                found = x;
                break;
            }
        }

        console.log('Found Plugin in Storage', found);

        if(found >= 0){
            plugins[x] = json;
        }else{
            plugins.push(json);
            obj.allPlugins[json.name] = obj.initPlugin(json);
        }

        console.log('Setup Plugins', JSON.stringify(plugins));

        obj.pluginsJSON = plugins;

        global.localStorage.setItem('plugins', JSON.stringify(obj.pluginsJSON));

        console.log('Wrote Plugin');

        return plugins;
    };

    obj.registerPlugin = function(name, callback){
        var dir = obj.pluginsDir + name;
        $.get(dir + '/package.json')
        .success(function(json){
            loadScript(
                dir + '/index.js',
                function(){
                    json.enabled = true;
                    obj.writePlugin(json);
                    obj.triggerPluginEvent(json, 'onInstall', callback);
                }
            );
        })
        .error(function(err){
            console.log('Erroring getting package JSON', JSON.stringify(err));
            callback();
        });
    };

    obj.removePlugin = function(plugin, callback){
        var plugins = obj.getPlugins();

        var found = -1;

        for(var x in plugins){
            var p = plugins[x];
            if(p.name === plugin.name){
                found = x;
                break;
            }
        }

        if(found >= 0){
            delete plugins[x];
        }
        obj.pluginsJSON = plugins;

        global.localStorage.setItem('plugins', JSON.stringify(obj.pluginsJSON));

        if(obj.allPlugins[plugin.name]){
            return obj.triggerPluginEvent(plugin.name, 'destroy', function(){
                delete obj.allPlugins[plugin.name];
                callback();
            });
        }
        callback('Unable to trigger destroy');
    };

    obj.retrieveFromStorage = function(){

        var plugins = [];

        try{

            // This loaded an array of the available plugin's plugin.json file
            var pluginsJSON = global.localStorage.getItem('plugins');

            if(pluginsJSON && pluginsJSON.length){
                plugins = JSON.parse(pluginsJSON);
            }

        }catch(e){
            alert('Error Reading Plugins');
            return [];
        }

        plugins.forEach(function(plugin, i){
            if(!plugin || !plugin.name) {
                console.log('Invalid plugin found in storage');
                plugins.splice(i, 1);
            }
        });

        obj.pluginsJSON = plugins;

        return plugins;
    };

    // Retrieve Plugins from Storage
    obj.retrievePlugins = function(callback){
        console.log('Retrieving plugins');

        var plugins = obj.retrieveFromStorage();

        obj.loadPluginScripts(function(){
            console.log('Loaded Plugin Scripts');
            obj.mapPlugins(plugins);

            // Update Devices
            //Skynet.updateDeviceSetting({
            //    plugins : plugins
            //}, function(){
            //    console.log('Skynet Updated');
            //});

            callback();
        });

        return plugins;
    };

    obj.loadPluginScripts = function(callback){

        var i = 0;

        var done = function(){
            if(obj.pluginsJSON.length === i){
                callback();
            }
            i++;
        };

        if(!obj.pluginsJSON || !obj.pluginsJSON.length) return done();

        obj.pluginsJSON.forEach(function(plugin){
            if(!plugin) return done();
            loadScript(
                obj.pluginsDir + plugin.name + '/index.js',
                function(){
                    done();
                }
            );
        });
    };

    obj.mapPlugins = function(){
        obj.pluginsJSON.forEach(function(plugin){
            if(!plugin) return;
            obj.allPlugins[plugin.name] = obj.initPlugin(plugin);
        });
    };

    // Individual Plugin Object
    obj.initPlugin = function(plugin){

        var p;

        if(global.octobluMobile.plugins[plugin.name]){
            p = global.octobluMobile.plugins[plugin.name];
        }

        return p ? new p.Plugin(obj.Messenger, plugin.options) : null;
    };

    obj.triggerPluginEvent = function(plugin, event, callback){
        if(obj.allPlugins[plugin.name]){

            switch(event){
            case 'onEnable':
                plugin.enabled = true;
                obj.writePlugin(plugin);
                break;
            case 'onDisable':
                plugin.enabled = false;
                obj.writePlugin(plugin);
                break;
            case 'onInstall':
            case 'destroy':
                break;
            default:
                return callback('Not a valid event');
            }

            if(typeof obj.allPlugins[plugin.name][event] === 'function'){
                return obj.allPlugins[plugin.name][event](callback);
            }else{
                return callback('No event found for plugin');
            }

        }
        return callback('No plugin found');
    };

    obj.getPlugins = function(){
        return obj.pluginsJSON || obj.retrieveFromStorage();
    };

    obj.loadGreetings = function(callback){
        var found = -1;

        for(var x in obj.pluginsJSON){
            var plugin = obj.pluginsJSON[x];
            if(!plugin) continue;
            if(plugin.name === 'GreetingsPlugin'){
                found = x;
                break;
            }
        }
        console.log('Found', found);
        if(found < 0){
            return obj.registerPlugin('GreetingsPlugin', function(){
                obj.retrievePlugins(callback);
            });
        }
        callback();
    };

    // Called Every Time the App is loaded
    obj.init = function(){
        obj.Skynet = global.Skynet;
        obj.Messenger = global.Messenger.init();

        global.octobluMobile.api.logActivity = obj.Skynet.logActivity;

        console.log('Init', obj.Skynet);
        obj.retrievePlugins(function(){
            console.log('Retrieved plugins');
            obj.loadGreetings(function(){
                console.log('Everything has finished loading');
            });
        });

    };

    var api = {
        logActivity : function(data){
            console.log('Dummy Skynet Activity', JSON.stringify(data));
        }
    };

    var octobluMobile = {
        init : obj.init,
        api : api,
        plugins : {},
        getPlugins : obj.getPlugins,
        triggerPluginEvent : obj.triggerPluginEvent,
        removePlugin : obj.removePlugin
    };

    return octobluMobile;

})(window);
