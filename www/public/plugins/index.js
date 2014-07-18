'use strict';


var Q = require('Q');
var API = require('./api.js');

var obj = {};

obj.instances = {};

obj.plugins = false;

obj.subdevices = [];

obj.pluginsIndex = {};

obj.pluginsDir = '/public/plugins/local_plugins/';

obj.api = null;

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

obj.getSubdevices = function () {
    var getSubdevicesFromStorage = function () {
        var subdevices = [];
        try {
            subdevices = JSON.parse(window.localStorage.getItem('subdevices'));
        } catch (e) {}

        return subdevices;
    };
    return obj.subdevices || getSubdevicesFromStorage();
};

obj.writePlugin = function (json, init, removing) {
    if (typeof init === 'undefined') init = true;
    console.log('Writing Plugin', json.name);

    if (!json._path) {
        json._path = obj.pluginsDir + json.name + '/bundle.js';
    }

    if (!json.subdevices) {
        json.subdevices = [];
    }

    if (!removing) {
        obj.subdevices.forEach(function (item) {
            if (item.type === json.name) {
                var found = false;
                for (var x in json.subdevices) {
                    var d = json.subdevices[x];
                    if (d._id === item._id) {
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    json.subdevices.push(item);
                }
            }
        });
    }

    var found = obj.findPlugin(json.name);

    if (~found) {
        obj.plugins[found] = json;
    } else {
        json.enabled = true;
        obj.plugins.push(json);
    }

    obj.writePluginsToStorage();

    if (init) {
        obj.initPlugin(json);
    }

    return obj.plugins;
};

obj.removePlugin = function (plugin) {
    var deferred = Q.defer();

    var plugins = obj.getPlugins();

    var found = obj.findPlugin(plugin.name);

    if (~found) {
        plugins.splice(found, 1);
    }

    obj.plugins = plugins;

    obj.writePluginsToStorage();

    obj.triggerPluginEvent(plugin, 'destroy');

    var deleted = false;
    plugin.subdevices
        .forEach(function(subdevice){
            delete obj.instances[subdevice.name];
            deleted = true;
        });

    if(deleted)
        deferred.resolve();
    else
        deferred.reject();

    return deferred.promise;
};

obj.writePluginsToStorage = function () {
    var subdevices = [];
    for (var x in obj.plugins) {
        subdevices = subdevices.concat(obj.plugins[x].subdevices || []);
    }
    obj.subdevices = subdevices;
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

        var subdevices = window.localStorage.getItem('subdevices');

        obj.subdevices = JSON.parse(subdevices) || [];

    } catch (e) {
        alert('Error Reading Plugins');
        return [];
    }

    plugins.forEach(function (plugin, i) {

        if (!plugin || !plugin.name) {
            console.log('Invalid plugin found in storage' + JSON.stringify(plugin));
            plugins.splice(i, 1);
            return;
        }

        plugins[i].subdevices = plugin.subdevices || [];

        obj.pluginsIndex[plugin.name] = i;
    });

    obj.plugins = plugins;

    return plugins;
};

// Retrieve Plugins from Storage
obj.retrievePlugins = function () {
    var deferred = Q.defer();

    console.log('Retrieving plugins');

    var plugins = obj.retrieveFromStorage();
    console.log('Plugins from storage' + JSON.stringify(plugins));

    obj.loadPluginScripts()
        .done(function () {
            console.log('Loaded Plugin Scripts');
            obj.mapPlugins(plugins);

            // Update Devices
            obj.Skynet.updateDeviceSetting({
                plugins: obj.plugins,
                subdevices: obj.subdevices
            }).then(function () {
                console.log('Skynet Updated');
            }, function () {
                console.log('Skynet Not Updated');
            });

            deferred.resolve();
        }, deferred.resolve);

    return deferred.promise;
};

obj.download = function(plugin){
    var deferred = Q.defer();
    var entry,
        fileTransfer = new FileTransfer(),
        directories = ['plugins', plugin.name],
        uri = encodeURI(plugin.bundle);

    function gotFS() {
        entry.getDirectory(directories[0], {
            create: true,
            exclusive: false
        }, createPluginDir, deferred.reject);
    }

    function createPluginDir() {
        entry.getDirectory(directories.join('/'), {
            create: true,
            exclusive: false
        }, onGetDirectorySuccess, deferred.reject);
    }

    function onGetDirectorySuccess(dir) {
        console.log('Created dir ' + dir.name);
        var file = '/bundle.js';
        fileTransfer.download(
            uri,
            steroids.app.absoluteUserFilesPath + '/' + directories.join('/') + file,
            function (entry) {
                console.log('download complete: ' + entry.toURL());

                plugin._url = entry.toURL();
                plugin._path = '/plugins/' + plugin.name + file;

                if(!plugin.subdevices) plugin.subdevices = [];

                obj.loadPlugin(plugin)
                    .done(function(){
                        deferred.resolve(plugin);
                    }, deferred.reject);
            },
            deferred.reject,
            false
        );
    }

    try {
        if (window.FSRoot) {
            entry = window.FSRoot;
            gotFS();
        } else {
            deferred.reject(new Error('Error no access to file system.'));
        }
    } catch (e) {
        deferred.reject(new Error('No Error Installing Plugin'));
    }

    return deferred.promise;
};

obj.loadScript = function (json) {
    var deferred = Q.defer();

    var path = json._path || obj.pluginsDir + json.name + '/bundle.js';
    var script = $('script[src="'+path+'"]');
    if(script.size()){
        script.remove();
        if(json.subdevices && json.subdevices.length){
            json.subdevices
                .forEach(function(subdevice){
                    if(obj.instances[subdevice.name]) delete obj.instances[subdevice.name];
                    var camel = subdevice.name.toCamel();
                    if(window.skynetPlugins[camel]) delete window.skynetPlugins[camel];
                });
        }
    }
    $.getScript(path)
        .done(function (script, textStatus) {
            console.log('Script loaded: ' + textStatus);
            deferred.resolve(json);
        })
        .fail(function (jqxhr, settings, exception) {
            console.log('Script (' + path + ') Failed to load :: ' + jqxhr.status + ' Settings : ' + JSON.stringify(settings) + ' Exception : ' + exception.toString());
            if(jqxhr.status === 404){
                // TODO ReDownload
                obj.download(json)
                    .done(deferred.resolve, deferred.reject);
            }else{
                deferred.reject();
            }
        });

    return deferred.promise;
};


obj.loadPluginScripts = function () {

    var deferred = Q.defer();

    if (!obj.plugins || !obj.plugins.length) {
        deferred.resolve();
    } else {
        var promises = [];

        for (var x in obj.plugins) {
            var plugin = obj.plugins[x];

            if (!plugin) continue;
            if (obj.instances[plugin.name]) {
                continue;
            }

            console.log('About to load script for ' + plugin.name);
            promises.push(obj.loadScript(plugin));
        }


        Q.all(promises).done(deferred.resolve, deferred.reject);

    }
    return deferred.promise;

};

obj.registerPlugin = function (name) {

    var deferred = Q.defer();

    var found = obj.findPlugin(name);

    if (~found) {
        deferred.resolve();
    } else {
        var dir = obj.pluginsDir + name;
        $.getJSON(dir + '/package.json')
            .success(function (json) {
                console.log('Got package JSON');
                obj.writePlugin(json, false);
                deferred.resolve();
            })
            .error(function (err) {
                console.log('Error getting package JSON' + JSON.stringify(err));
                deferred.reject();
            });
    }

    return deferred.promise;
};

obj.loadPlugin = function (data) {
    var deferred = Q.defer();
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
        return obj.registerPlugin(name)
            .then(function () {
                found = obj.findPlugin(name);
                var plugin = obj.plugins[found];
                obj.loadScript(plugin)
                    .then(obj.initPlugin)
                    .done(deferred.resolve, deferred.reject);
            });
    } else {
        var plugin = obj.plugins[found];
        obj.initPlugin(plugin);
        deferred.resolve();
    }

    return deferred.promise;
};

obj.mapPlugins = function () {
    obj.each(function (plugin) {
        if (!plugin) return;
        obj.initPlugin(plugin);
    });
};

obj.initPlugin = function(plugin){
    var deferred = Q.defer();

    plugin.subdevices.forEach(function (subdevice) {
        obj.initDevice(subdevice);
    });

    deferred.resolve();

    return deferred.promise;
};

// Individual Plugin Object
obj.initDevice = function (subdevice) {
    console.log('INIT DEVICE :: ' + subdevice.name);

    var pluginObj;

    var globalPlugins = window.skynetPlugins;

    var camelName = subdevice.type.toCamel();

    var p = globalPlugins && globalPlugins[camelName] ? globalPlugins[camelName] : null;

    try {

        pluginObj = p ? new p.Plugin(
                obj.Messenger,
                subdevice.options || {},
                obj.api
            ) : null;

        var found = obj.findPlugin(subdevice.type);
        if (~found) {
            obj.plugins[found].optionsSchema = p.optionsSchema;
            obj.plugins[found].messageSchema = p.messageSchema;
        }

    } catch (e) {
        console.log(e);
        pluginObj = null;
    }

    if (p && p.getDefaultOptions) {
        pluginObj.getDefaultOptions = p.getDefaultOptions;
    }

    obj.instances[subdevice.name] = pluginObj;

    return pluginObj;

};

obj.triggerDeviceEvent = function(subdevice, event){

    var deferred = Q.defer();

    var Plugin = obj.instances[subdevice.name];

    if (Plugin) {

        if (typeof Plugin[event] === 'function') {

            try{
                Plugin[event].call(Plugin, deferred.resolve);
            }catch(e){
                deferred.resolve('Error Triggering Event');
                return;
            }

            deferred.resolve();
        } else {
            deferred.resolve('No event found for plugin');
        }

    }else{
        deferred.resolve('No plugin found :: ' + subdevice.name);
    }

    return deferred.promise;

};

obj.triggerPluginEvent = function (plugin, event) {

    var deferred = Q.defer();
    var pluginMethod = false;

    switch (event) {
        case 'onEnable':
            plugin.enabled = true;
            obj.writePlugin(plugin);
            break;
        case 'onDisable':
            plugin.enabled = false;
            obj.writePlugin(plugin);
            break;
        case 'getDefaultOptions':
        case 'onInstall':
            pluginMethod = true;
            break;
        case 'onMessage':
        case 'destroy':
            break;
        default:
            return deferred.reject('Not a valid event');
    }

    if(!pluginMethod){
        var promises = [];

        plugin.subdevices
            .forEach(function (subdevice) {
                promises.push(obj.triggerDeviceEvent(subdevice, event));
            });

        Q.all(promises)
            .done(deferred.resolve, deferred.resolve);
    }else{
        var first = plugin.subdevices[0] || null;
        if(first) {
            obj.triggerDeviceEvent(first, event)
                .done(function(err, o){
                    if(err) console.log('Error', err);
                    console.log('Response', JSON.stringify(o));
                    deferred.resolve();
                }, deferred.resolve);
        }else{
            deferred.reject();
        }
    }

    return deferred.promise;
};

obj.startListen = function () {
    obj.conn.on('message', function (data, fn) {

        console.log('On Message' + JSON.stringify(data));

        if (data.devices === obj.skynetObj.mobileuuid) {

            try {

                if (typeof data === "string") {
                    data = JSON.parse(data);
                }

                if (data.subdevice) {

                    var instance = obj.instances[data.subdevice];

                    if (instance && instance.onMessage) {

                        console.log('Matching subdevice found:', data.subdevice);

                        obj.api.logActivity({
                            type: data.subdevice,
                            html: 'Received Message: ' + JSON.stringify(data.payload)
                        });

                        instance.onMessage(data, fn);

                    } else {
                        console.log('No matching subdevice:', data.subdevice);
                    }

                } else {
                    if (fn) {
                        console.log('Responding');
                        data.ack = true;
                        fn(data);
                    }
                }

            } catch (e) {

                console.log('Err dispatching message', e);

            }

        }
    });
};

obj.loadLocalPlugins = function () {
    var deferred = Q.defer();

    $.getJSON('/data/local_plugins.json')
        .success(function (json) {

            if (json) {

                var promises = [];
                for (var x in json) {
                    var plugin = json[x];
                    promises.push(obj.loadPlugin(plugin));
                }
                Q.all(promises).done(deferred.resolve, deferred.reject);

            } else {
                deferred.resolve();
            }
        })
        .error(function (err) {
            console.log('Error JSON' + JSON.stringify(err));
            deferred.reject();
        });
    return deferred.promise;
};

// Called Every Time the App is loaded
obj.init = function () {
    var deferred = Q.defer();

    obj.Skynet = window.Skynet;
    obj.skynetObj = obj.Skynet.getCurrentSettings();
    obj.conn = obj.skynetObj.conn;
    obj.Messenger = require('./messenger').init();

    obj.api = API();

    console.log('Init Plugins');

    Q.all([

        obj.retrievePlugins(),

        obj.loadLocalPlugins()

    ]).done(function () {

        console.log('Plugins Loaded');

        obj.startListen();

        $(document).trigger('plugins-ready');

        deferred.resolve();

    }, deferred.reject);

    return deferred.promise;

};

var octobluMobile = {
    init: obj.init,
    plugins: {},
    initPlugin : obj.initPlugin,
    initDevice : obj.initDevice,
    getPlugins: obj.getPlugins,
    download: obj.download,
    getSubdevices: obj.getSubdevices,
    triggerPluginEvent: obj.triggerPluginEvent,
    removePlugin: obj.removePlugin,
    writePlugin: obj.writePlugin,
    loadPlugin: obj.loadPlugin,
    clearStorage: obj.clearStorage,
    triggerDeviceEvent : obj.triggerDeviceEvent
};

module.exports = octobluMobile;
