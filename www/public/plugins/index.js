'use strict';

var obj = {};

obj.Skynet = window.Skynet;
obj.Messenger = window.Messenger;

obj.allPlugins = {};

obj.pluginsJSON = false;

obj.pluginsDir = '/public/plugins/modules/';

function loadScript(url, callback) {
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
obj.each = function (cb) {
    obj.pluginsJSON.forEach(cb);
};

obj.findPlugin = function(name){
    var plugins = obj.getPlugins();

    var found = -1;

    for (var x in plugins) {
        var plugin = plugins[x];
        if (!plugin) continue;
        if (plugin.name === name) {
            found = x;
            break;
        }
    }
    return found;
};

obj.writePlugin = function (json) {
    console.log('Writing Plugin', json.name);

    if(!json._url){
        json._url = obj.pluginsDir + name+ '/bundle.js';
    }

    var found = obj.findPlugin(json.name);

    if (~found) {
        obj.pluginsJSON[found] = json;
    } else {
        obj.pluginsJSON.push(json);
    }

    window.localStorage.setItem('plugins', JSON.stringify(obj.pluginsJSON));

    console.log('Wrote Plugins', JSON.stringify(obj.pluginsJSON));

    obj.allPlugins[json.name] = obj.initPlugin(json);

    return obj.pluginsJSON;
};

obj.registerPlugin = function (name, callback) {

    var done = function(json){
        console.log('About to load script');
        loadScript(
            json._url || dir + '/bundle.js',
            function () {
                json.enabled = true;
                obj.writePlugin(json);
                obj.triggerPluginEvent(json, 'onInstall', callback);
            }
        );

    };

    var found = obj.findPlugin(name);

    if (~found) {
        return done(obj.pluginsJSON[found]);
    }

    var dir = obj.pluginsDir + name;
    $.get(dir + '/package.json')
    .success(done)
    .error(function (err) {
        console.log('Erroring getting package JSON', JSON.stringify(err));
        callback();
    });

};

obj.removePlugin = function (plugin, callback) {
    var plugins = obj.getPlugins();

    var found = obj.findPlugin(plugin.name);

    if (found >= 0) {
        plugins.slice(found, 1);
    }

    obj.pluginsJSON = plugins;

    window.localStorage.setItem('plugins', JSON.stringify(obj.pluginsJSON));

    if (obj.allPlugins[plugin.name]) {
        return obj.triggerPluginEvent(plugin.name, 'destroy', function () {
            delete obj.allPlugins[plugin.name];
            callback();
        });
    }
    callback('Unable to trigger destroy');
};

obj.clearStorage = function(){
    var plugins = [];

    window.localStorage.setItem('plugins', JSON.stringify(plugins));

    obj.pluginsJSON = [];

    obj.allPlugins = {};
};

obj.retrieveFromStorage = function () {

    var plugins = [];

    try {

        // This loaded an array of the available plugin's plugin.json file
        var pluginsJSON = window.localStorage.getItem('plugins');

        if (pluginsJSON && pluginsJSON.length) {
            plugins = JSON.parse(pluginsJSON);
        }

    } catch (e) {
        alert('Error Reading Plugins');
        return [];
    }

    plugins.forEach(function (plugin, i) {
        if (!plugin || !plugin.name) {
            console.log('Invalid plugin found in storage');
            plugins.splice(i, 1);
        }
    });

    obj.pluginsJSON = plugins;

    return plugins;
};

// Retrieve Plugins from Storage
obj.retrievePlugins = function (callback) {
    console.log('Retrieving plugins');

    var plugins = obj.retrieveFromStorage();

    // This is a fix for an incorrect plugin
    var found = obj.findPlugin('GreetingsPlugin');
    if (~found) {
        obj.clearStorage();
        plugins = [];
    }

    obj.loadPluginScripts(function () {
        console.log('Loaded Plugin Scripts');
        obj.mapPlugins(plugins);

        // Update Devices
        obj.Skynet.updateDeviceSetting({
            plugins : plugins
        }, function(){
            console.log('Skynet Updated');
        });

        callback();
    });

    return plugins;
};

obj.loadPluginScripts = function (callback) {

    var i = 0;

    var done = function () {
        if (obj.pluginsJSON.length === i) {
            callback();
        }
    };

    if (!obj.pluginsJSON || !obj.pluginsJSON.length) return done();

    obj.each(function (plugin) {
        if (!plugin) return done();
        loadScript(
            plugin._url,
            function () {
                i++;
                done();
            }
        );
    });
};

obj.mapPlugins = function () {
    obj.each(function (plugin) {
        if (!plugin) return;
        obj.allPlugins[plugin.name] = obj.initPlugin(plugin);
    });
};

// Individual Plugin Object
obj.initPlugin = function (plugin) {

    var p = require(plugin.name);

    var pluginObj = p ? new p.Plugin(
                                obj.Messenger,
                                plugin.options || {},
                                window.octobluMobile.api
                            ) : null;

    var found = obj.findPlugin(plugin.name);

    if(~found){
        obj.pluginsJSON[found].optionsSchema = p.optionsSchema;
        obj.pluginsJSON[found].messageSchema = p.messageSchema;
    }

    return pluginObj;
};

obj.triggerPluginEvent = function (plugin, event, callback) {
    if (obj.allPlugins[plugin.name]) {

        switch (event) {
        case 'onEnable':
            plugin.enabled = true;
            obj.writePlugin(plugin);
            break;
        case 'onDisable':
            plugin.enabled = false;
            obj.writePlugin(plugin);
            break;
        case 'onInstall':
        case 'onMessage':
        case 'destroy':
            break;
        default:
            return callback('Not a valid event');
        }

        if (typeof obj.allPlugins[plugin.name][event] === 'function') {
            return obj.allPlugins[plugin.name][event](callback);
        } else {
            return callback('No event found for plugin');
        }

    }
    return callback('No plugin found');
};

obj.getPlugins = function () {
    return obj.pluginsJSON || obj.retrieveFromStorage();
};

obj.loadPlugin = function (data, callback) {
    var name;
    if(typeof data === 'string'){
        name = data;
    }else{
        name = data.name;
        obj.writePlugin(data);
        console.log('Wrote plugin in load plugin');

    }
    var found = obj.findPlugin(name);
    if (!~found || !obj.allPlugins[name]) {
        console.log('Installing Plugin', name);
        return obj.registerPlugin(name, function () {
            obj.retrievePlugins(callback);
        });
    }
    callback();
};

obj.startListen = function(){
    obj.socket.on('message', function(data, fn){
        console.log('On Message', JSON.stringify(data));
        _.forEach(obj.allPlugins, function(plugin){
            console.log('Sending to plugin');
            plugin.onMessage(data, fn);
        });
    });
};

// Called Every Time the App is loaded
obj.init = function () {
    obj.Skynet = window.Skynet;
    obj.skynetObj = obj.Skynet.getCurrentSettings();
    obj.socket = obj.skynetObj.skynetSocket;
    obj.Messenger = require('./messenger').init();

    window.octobluMobile.api.logActivity = obj.Skynet.logActivity;

    console.log('Init', obj.Skynet);

    obj.retrievePlugins(function () {
        console.log('Loaded plugins');

        obj.loadPlugin('skynet-greeting', function () {
            console.log('After Greetings Install');

            obj.startListen();
        });
    });

};

var api = {
    logActivity: function (data) {
        console.log('Dummy Skynet Activity', JSON.stringify(data));
    }
};

var octobluMobile = {
    init: obj.init,
    api: api,
    plugins: {},
    getPlugins: obj.getPlugins,
    triggerPluginEvent: obj.triggerPluginEvent,
    removePlugin: obj.removePlugin,
    writePlugin : obj.writePlugin,
    loadPlugin : obj.loadPlugin,
    pluginsDir : obj.pluginsDir
};

module.exports = window.octobluMobile = octobluMobile;
