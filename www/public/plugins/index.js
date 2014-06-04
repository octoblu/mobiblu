window.octobluMobile = (function(global, octo, Skynet, messenger){
    //'use strict';

    if(!octo || !octo.length){
        octo = global.octobluMobile = {};
    }

    var obj = this;

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
        console.log('Writing Plugin');

        var plugins = obj.pluginsJSON || obj.retrieveFromStorage();

        var found = -1;

        for(var x in plugins){
            var plugin = plugins[x];
            if(plugin.name === json.name){
                found = x;
                break;
            }
        }

        if(found >= 0){
            plugins[x] = json;
            if(obj.allPlugins[x]) obj.allPlugins[x] = obj.initPlugin(json);
        }else{
            json.enabled = true;
            plugins.push(json);
            obj.allPlugins.push(obj.initPlugin(json));
        }

        obj.pluginsJSON = plugins;

        global.localStorage.setItem('plugins', JSON.stringify(obj.pluginsJSON));

        console.log('Wrote Plugin');

        return plugins;
    };

    obj.registerPlugin = function(name, callback){
        var dir = obj.pluginsDir + name;
        console.log('Registering Plugin', dir);
        $.get(dir + '/package.json')
        .success(function(json){
            obj.writePlugin(json);
            callback();
        })
        .error(function(err){
            console.log('Erroring getting package JSON', JSON.stringify(err));
            callback();
        });
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
        };

        if(!obj.pluginsJSON || !obj.pluginsJSON.length) return done();

        obj.pluginsJSON.forEach(function(plugin){
            loadScript(
                obj.pluginsDir + plugin.name + '/index.js',
                function(){
                    i++;
                    done();
                }
            );
        });
    };

    obj.mapPlugins = function(){
        obj.pluginsJSON.forEach(function(plugin){
            obj.allPlugins[plugin.name] = obj.initPlugin(plugin);
        });
    };

    // Individual Plugin Object
    obj.initPlugin = function(plugin){

        var p;

        if(octo.plugins[plugin.name]){
            p = octo.plugins[plugin.name];
        }

        return p ? p.Plugin(messenger) : null;
    };

    obj.loadGreetings = function(callback){
        var found = -1;

        for(var x in obj.pluginsJSON){
            var plugin = obj.pluginsJSON[x];
            if(plugin.name === 'GreetingsPlugin'){
                found = x;
                break;
            }
        }

        if(found < 0){
            return obj.registerPlugin('GreetingsPlugin', function(){
                obj.retrievePlugins(callback);
            });
        }
        callback();
    };

    // Called Every Time the App is initilized
    obj.init = function(){
        console.log('Init');
        obj.retrievePlugins(function(){
            console.log('Retrieved plugins');
            obj.loadGreetings(function(){
                console.log('Everything has finished loading');
            });
        });

    };

    var api = {
        logActivity : obj.logActivity
    };

    octo.init = obj.init;

    octo.api = api;

    return octo;

})(window, window.octobluMobile, window.Skynet, window.messenger);
