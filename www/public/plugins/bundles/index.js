require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"Focm2+":[function(require,module,exports){
'use strict';

var obj = {};

obj.instances = {};

obj.plugins = false;

obj.subdevices = [];

obj.pluginsIndex = {};

obj.pluginsDir = '/public/plugins/modules/';

// Utilities
obj.each = function (cb) {
    obj.plugins.forEach(cb);
};

obj.findPlugin = function (name) {
    // If already cached
    var index = obj.pluginsIndex[name];
    if (index && ~index) return index;

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

obj.getPlugins = function () {
    return obj.plugins || obj.retrieveFromStorage();
};

obj.writePlugin = function (json, init) {
    if (typeof init === 'undefined') init = true;
    console.log('Writing Plugin', json.name);

    if (!json._path) {
        json._path = obj.pluginsDir + json.name + '/bundle.js';
    }

    var found = obj.findPlugin(json.name);

    if (~found) {
        obj.plugins[found] = json;
    } else {
        obj.plugins.push(json);
    }

    obj.writePluginsToStorage();

    if (init) obj.instances[json.name] = obj.initPlugin(json);

    return obj.plugins;
};

obj.removePlugin = function (plugin, callback) {
    var plugins = obj.getPlugins();

    var found = obj.findPlugin(plugin.name);

    if (~found) {
        plugins.slice(found, 1);
    }

    obj.plugins = plugins;

    obj.writePluginsToStorage();

    if (obj.instances[plugin.name]) {
        return obj.triggerPluginEvent(plugin.name, 'destroy', function () {
            delete obj.instances[plugin.name];
            callback();
        });
    }
    callback('Unable to trigger destroy');
};

obj.writePluginsToStorage = function(){
    var subdevices = [];
    for(var x in obj.plugins){
        subdevices = subdevices.concat(obj.plugins[x].subdevices || []);
    }
    window.localStorage.setItem('subdevices', JSON.stringify(subdevices));
    window.localStorage.setItem('plugins', JSON.stringify(obj.plugins));
};

obj.clearStorage = function () {

    obj.plugins = [];

    obj.instances = {};

    obj.writePluginsToStorage();

};

obj.retrieveFromStorage = function () {

    var plugins = [];

    try {

        // This loaded an array of the available plugin's plugin.json file
        var pluginsJSON = window.localStorage.getItem('plugins');

        if (pluginsJSON && pluginsJSON.length) {
            plugins = JSON.parse(pluginsJSON);
        }

        var subdevices = window.localStorage.getItem('plugins');

        obj.subdevices = JSON.parse(subdevices) || [];

    } catch (e) {
        alert('Error Reading Plugins');
        return [];
    }

    plugins.forEach(function (plugin, i) {
        if (!plugin || !plugin.name) {
            console.log('Invalid plugin found in storage');
            plugins.splice(i, 1);
        }

        obj.pluginsIndex[plugin.name] = i;
    });

    obj.plugins = plugins;

    return plugins;
};

// Retrieve Plugins from Storage
obj.retrievePlugins = function (callback) {
    console.log('Retrieving plugins');

    var plugins = obj.retrieveFromStorage();
    console.log('Plugins from storage', JSON.stringify(plugins));

    obj.loadPluginScripts(function () {
        console.log('Loaded Plugin Scripts');
        obj.mapPlugins(plugins);

        // Update Devices
        obj.Skynet.updateDeviceSetting({
            plugins : obj.plugins,
            subdevices : obj.subdevices
        }, function () {
            console.log('Skynet Updated');
        });

        callback();
    });

    return plugins;
};

obj.loadScript = function (json, callback) {
    var path = json._path || obj.pluginsDir + json.name + '/bundle.js';
    $.getScript(path)
        .done(function (script, textStatus) {
            console.log('Script loaded: ' + textStatus);
            callback();
        })
        .fail(function (jqxhr, settings, exception) {
            console.log('Script Failed to load');
            callback();
        });
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
        if (obj.instances[plugin.name]) {
            i++;
            return done();
        }
        console.log('About to load script');
        obj.loadScript(plugin, function () {
            console.log('Loaded script ' + plugin.name);
            i++;
            done();
        });
    });

};

obj.registerPlugin = function (name, callback) {

    var done = function () {
        console.log('About to load script');
        callback();
    };

    var found = obj.findPlugin(name);
    console.log('Found', found);
    if (found && ~found) {
        return done(obj.plugins[found]);
    }

    var dir = obj.pluginsDir + name;
    $.get(dir + '/package.json')
        .success(function (json) {
            console.log('Got package JSON');
            obj.writePlugin(json, false);
            done();
        })
        .error(function (err) {
            console.log('Error getting package JSON', JSON.stringify(err));
            callback();
        });

};

obj.loadPlugin = function (data, callback) {
    var name;
    if (typeof data === 'string') {
        name = data;
    } else {
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

obj.mapPlugins = function () {
    obj.each(function (plugin) {
        if (!plugin) return;
        obj.instances[plugin.name] = obj.initPlugin(plugin);
    });
};

// Individual Plugin Object
obj.initPlugin = function (plugin) {

    var pluginObj;

    var globalPlugins = window.skynetPlugins;

    var camelName = plugin.name.toCamel();

    try {

        var p = globalPlugins && globalPlugins[camelName] ? globalPlugins[camelName] : require(plugin.name);

        pluginObj = p ? new p.Plugin(
            obj.Messenger,
                plugin.options || {},
            window.octobluMobile.api
        ) : null;

        var found = obj.findPlugin(plugin.name);

        if (~found) {
            obj.plugins[found].optionsSchema = p.optionsSchema;
            obj.plugins[found].messageSchema = p.messageSchema;
        }

    } catch (e) {
        pluginObj = null;
    }

    if(p && p.getDefaultOptions){
        pluginObj.getDefaultOptions = p.getDefaultOptions;
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
            case 'getDefaultOptions':
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

obj.startListen = function () {
    obj.socket.on('message', function (data, fn) {
        console.log('On Message', JSON.stringify(data));
        _.forEach(obj.instances, function (plugin) {
            console.log('Sending to plugin');
            plugin.onMessage(data, fn);
        });
    });
};

obj.loadLocalPlugins = function(callback){
    var count = 0, total = 0;

    function done(){
        if(count === total){
            callback();
        }
    }

    $.getJSON('/data/local_plugins.json')
        .success(function (json) {

            if(json){
                total = json.length;
                json.forEach(function(plugin){

                    obj.loadPlugin(plugin, function () {
                        count++;
                        console.log('After install of ' + plugin);
                        done();
                    });

                });

            }else{
                done();
            }

        })
        .error(function (err) {
            console.log('Error JSON', JSON.stringify(err));
            done();
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

        obj.loadLocalPlugins(function(){
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
    writePlugin: obj.writePlugin,
    loadPlugin: obj.loadPlugin,
    clearStorage: obj.clearStorage
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