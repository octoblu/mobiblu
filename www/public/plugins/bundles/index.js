require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"Focm2+":[function(require,module,exports){
'use strict';

var obj = {};

obj.Skynet = window.Skynet;
obj.Messenger = window.Messenger;

obj.instances = {};

obj.plugins = false;

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
    obj.plugins.forEach(cb);
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

obj.writePlugin = function (json, init) {
    if(typeof init === 'undefined') init = true;
    console.log('Writing Plugin', json.name);

    if(!json._path){
        json._path = obj.pluginsDir + json.name + '/bundle.js';
    }

    var found = obj.findPlugin(json.name);

    console.log('Pre-write plugins', found, JSON.stringify(obj.plugins));

    if (~found) {
        obj.plugins[found] = json;
    } else {
        obj.plugins.push(json);
    }

    window.localStorage.setItem('plugins', JSON.stringify(obj.plugins));

    console.log('Wrote Plugins', JSON.stringify(obj.plugins));

    if(init) obj.instances[json.name] = obj.initPlugin(json);

    return obj.plugins;
};

obj.registerPlugin = function (name, callback) {

    var done = function(){
        console.log('About to load script');
        callback();
    };

    var found = obj.findPlugin(name);

    if (~found) {
        return done(obj.plugins[found]);
    }

    var dir = obj.pluginsDir + name;
    $.get(dir + '/package.json')
    .success(function(json){
        obj.writePlugin(json, false);
        done();
    })
    .error(function (err) {
        console.log('Erroring getting package JSON', JSON.stringify(err));
        callback();
    });

};

obj.loadScript = function(json, callback){
    var path = json._path || obj.pluginsDir + json.name + '/bundle.js';
    loadScript(path, callback);
};

obj.removePlugin = function (plugin, callback) {
    var plugins = obj.getPlugins();

    var found = obj.findPlugin(plugin.name);

    if (~found) {
        plugins.slice(found, 1);
    }

    obj.plugins = plugins;

    window.localStorage.setItem('plugins', JSON.stringify(obj.plugins));

    if (obj.instances[plugin.name]) {
        return obj.triggerPluginEvent(plugin.name, 'destroy', function () {
            delete obj.instances[plugin.name];
            callback();
        });
    }
    callback('Unable to trigger destroy');
};

obj.clearStorage = function(){
    var plugins = [];

    window.localStorage.setItem('plugins', JSON.stringify(plugins));

    obj.plugins = [];

    obj.instances = {};
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

    obj.plugins = plugins;

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
        if (obj.plugins.length === i) {
            callback();
        }
    };

    if (!obj.plugins || !obj.plugins.length) return done();

    obj.each(function (plugin) {
        if (!plugin) return done();
        if (obj.instances[plugin.name]){
            i++;
            return done();
        }
        obj.loadScript(plugin, function () {
            i++;
            done();
        });
    });

};

obj.mapPlugins = function () {
    obj.each(function (plugin) {
        if (!plugin) return;
        obj.instances[plugin.name] = obj.initPlugin(plugin);
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
        obj.plugins[found].optionsSchema = p.optionsSchema;
        obj.plugins[found].messageSchema = p.messageSchema;
    }

    return pluginObj;
};

obj.triggerPluginEvent = function (plugin, event, callback) {
    if (obj.instances[plugin.name]) {

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

        if (typeof obj.instances[plugin.name][event] === 'function') {
            return obj.instances[plugin.name][event](callback);
        } else {
            return callback('No event found for plugin');
        }

    }
    return callback('No plugin found');
};

obj.getPlugins = function () {
    return obj.plugins || obj.retrieveFromStorage();
};

obj.loadPlugin = function (data, callback) {
    var name;
    if(typeof data === 'string'){
        name = data;
    }else{
        name = data.name;
        obj.writePlugin(data, false);
        console.log('Wrote plugin in load plugin');
    }
    var found = obj.findPlugin(name);
    if (!~found || !obj.instances[name]) {
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
        _.forEach(obj.instances, function(plugin){
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

},{"./messenger":3}],"./index.js":[function(require,module,exports){
module.exports=require('Focm2+');
},{}],3:[function(require,module,exports){
'use strict';

var obj = {};

var Skynet = null;
obj.skynetObj = {};
obj.socket = null;

// Called Every Time the Messenger is needed
obj.init = function () {
    Skynet = window.Skynet;
    obj.skynetObj = Skynet.getCurrentSettings();
    obj.socket = obj.skynetObj.skynetSocket;
    return obj;
};

obj.send = function (data, callback) {
    if (obj.socket) {
        Skynet.message(data, callback);
    } else {
        callback(new Error('Socket not available'));
    }
};

var Messenger = {
    init: obj.init,
    send: obj.send
};

module.exports = Messenger;

},{}]},{},[])