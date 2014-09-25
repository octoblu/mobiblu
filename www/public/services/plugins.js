'use strict';

angular.module('main.plugins')
  .service('Plugins', function($window, $rootScope, $http, FileSystem, SkynetConn, PluginInstances, Utils, Skynet, Subdevices, $q) {

    var service = {},
      plugins = [];

    var loaded = false;


    function findPlugin(name) {
      return _.findIndex(plugins, {
        name: name
      });
    }

    function writePluginsToStorage() {
      var _subdevices = [];
      for (var x in plugins) {
        _subdevices = _subdevices.concat(plugins[x].subdevices || []);
      }
      Subdevices.write(_subdevices);
      $window.mobibluStorage.setItem('plugins', plugins);
    }

    function retrieveFromStorage() {

      plugins = $window.mobibluStorage.getItem('plugins') || [];

      console.log('Plugins: ', plugins);

      var subdevices = Subdevices.retrieve();

      console.log('Retrieved Subdevices', JSON.stringify(subdevices));

      plugins.forEach(function(plugin, i) {

        if (!plugin || !plugin.name) {
          console.log('Invalid plugin found in storage' + JSON.stringify(plugin));
          plugins.splice(i, 1);
          return;
        }

        var subdevices = plugin.subdevices || [];

        subdevices = _.map(subdevices, function(subdevice) {
          if (!subdevice.uuid) subdevice.uuid = Utils.createID();
          return subdevice;
        });

        plugins[i].subdevices = subdevices;
      });

      return plugins;
    }

    function updateSkynet() {
      // @TODO Move at end of INIT Update Devices
      return Skynet.updateMobibluSetting({
        plugins: plugins,
        subdevices: Subdevices.retrieve()
      });
    }

    function retrievePlugins() {
      var deferred = $q.defer();

      console.log('Retrieving plugins');

      var plugins = retrieveFromStorage();

      console.log('Plugins from storage' + JSON.stringify(plugins));

      loadPluginScripts()
        .then(function() {
          console.log('Loaded Plugin Scripts');
          mapPlugins(plugins);

          updateSkynet();

          deferred.resolve();
        }, deferred.resolve);

      return deferred.promise;
    }

    function loadScript(json) {
      var deferred = $q.defer();

      var path = json._path;

      var script = $('script[src="' + path + '"]');
      if (script.size()) {
        script.remove();
        if (json.subdevices && json.subdevices.length) {
          json.subdevices
            .forEach(function(subdevice) {
              PluginInstances.deleteInstance(subdevice.uuid);
              var camel = subdevice.type.toCamel();
              if ($window.skynetPlugins[camel]) {
                delete $window.skynetPlugins[camel];
              }
            });
        }
      }
      $.getScript(path)
        .done(function(script, textStatus) {
          console.log('Script loaded: ' + textStatus);
          deferred.resolve(json);
        })
        .fail(function(jqxhr, settings, exception) {
          console.log('Script (' + path + ') Failed to load :: ' + jqxhr.status + ' Settings : ' + JSON.stringify(settings) + ' Exception : ' + exception.toString());
          if (jqxhr.status === 404) {
            service.download(json)
              .then(deferred.resolve, deferred.reject);
          } else {
            deferred.reject();
          }
        });

      return deferred.promise;
    }

    function loadPluginScripts() {

      var deferred = $q.defer();

      if (!plugins.length) {
        deferred.resolve();
      } else {
        var promises = [];

        for (var x in plugins) {
          var plugin = plugins[x];

          if (!plugin) continue;
          if (PluginInstances.find(plugin.uuid)) {
            continue;
          }

          console.log('About to load script for ' + plugin.name);
          promises.push(loadScript(plugin));
        }


        Promise.all(promises)
          .done(deferred.resolve, deferred.reject);

      }
      return deferred.promise;
    }

    function registerPlugin(name) {

      var deferred = $q.defer();

      var found = findPlugin(name);

      if (~found) {
        deferred.resolve();
      } else {
        deferred.reject();
      }

      return deferred.promise;
    }

    function mapPlugins() {
      _.each(plugins, function(plugin) {
        if (!plugin) return;
        service.initPlugin(plugin);
      });
    }

    function startListen() {
      SkynetConn.get('mobiblu').on('message', function(data, fn) {

        console.log('On Message' + JSON.stringify(data));

        if (data.devices === Skynet.mobileuuid) {
          try {
            if (typeof data === 'string') {
              data = JSON.parse(data);
            }

            if (data.subdevice) {

              var instance = PluginInstances.find(data.subdevice);

              if (instance && instance.onMessage) {

                console.log('Matching subdevice found:', data.subdevice);

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
    }

    service.initPlugin = function(plugin) {
      var deferred = $q.defer();

      if (plugin.enabled) {
        plugin.subdevices.forEach(service.initDevice);
      } else {
        console.log('Plugin Disabled');
      }

      deferred.resolve();

      return deferred.promise;
    };

    service.initDevice = function(subdevice) {
      return PluginInstances.initDevice(subdevice, function(p) {
        var found = findPlugin(subdevice.type);
        if (p.optionsSchema) {
          plugins[found].optionsSchema = p.optionsSchema;
        }
        if (p.messageSchema) {
          plugins[found].messageSchema = p.messageSchema;
        }
      });
    };

    service.loadPlugin = function(data) {
      var deferred = $q.defer();
      var name;
      if (typeof data === 'string') {
        name = data;
      } else {
        name = data.name;
        service.writePlugin(data, false);
        console.log('Wrote plugin in load plugin');
      }
      var found = findPlugin(name);
      if (!~found || !service.pluginIsLoaded(name)) {
        console.log('Installing Plugin', name);
        registerPlugin(name)
          .then(function() {
            console.log('Registered plugin');
            found = findPlugin(name);
            var plugin = plugins[found];

            loadScript(plugin)
              .then(function() {
                service.initPlugin(plugin);
                deferred.resolve();
              });
          });
      } else {
        var plugin = plugins[found];
        service.initPlugin(plugin);
        deferred.resolve();
      }

      return deferred.promise;
    };

    service.triggerPluginEvent = function(plugin, event) {

      var deferred = $q.defer();
      var pluginMethod = false;

      switch (event) {
        case 'onEnable':
          plugin.enabled = true;
          service.writePlugin(plugin);
          break;
        case 'onDisable':
          plugin.enabled = false;
          service.writePlugin(plugin);
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

      if (!pluginMethod) {
        var promises = [];

        plugin.subdevices
          .forEach(function(subdevice) {
            promises.push(PluginInstances.triggerDeviceEvent(subdevice, event));
          });

        Promise.all(promises)
          .done(deferred.resolve, deferred.resolve);
      } else {
        console.log('Subdevices :: ' + JSON.stringify(plugin.subdevices));
        var first = plugin.subdevices[0] || null;
        if (first) {
          PluginInstances.triggerDeviceEvent(first, event)
            .then(function(err, o) {
              if (err) console.log('Event Error: ' + err);
              console.log('Response from event: ' + JSON.stringify(o));
              deferred.resolve(err, o);
            }, deferred.resolve);
        } else {
          deferred.resolve();
        }
      }

      return deferred.promise;
    };

    service.getPlugins = function () {
        return plugins || retrieveFromStorage();
    };

    service.getPluginsList = function() {
      var pluginsUrl = 'https://rawgit.com/octoblu/mobiblu-plugins/master/plugins.json';
      return $http.get(pluginsUrl);
    };

    service.download = function(plugin) {
      var deferred = $q.defer();
      var file = '/plugin-' + plugin.name + '.js';
      FileSystem.download(plugin.bundle, file)
        .then(function(entry) {
            console.log('Download complete: ' + entry.toURL());

            plugin._url = entry.toURL();
            plugin._path = file;

            if (!plugin.subdevices) plugin.subdevices = [];

            service.loadPlugin(plugin)
              .then(updateSkynet)
              .then(function() {
                deferred.resolve(plugin);
              }, deferred.reject);
          });

      return deferred.promise;
    };

    service.clearStorage = function() {
      plugins = [];
      PluginInstances.clear();
      writePluginsToStorage();
    };

    service.writePlugin = function(json, init, removing) {
      if (_.isUndefined(init)) init = true;
      console.log('Writing Plugin', json.name);

      if (!json.subdevices) {
        json.subdevices = [];
      }

      if (!removing) {
        Subdevices.each(function(item) {
          if (item.type === json.name) {
            if (!_.findWhere(json.subdevices, { uuid: item.uuid })) {
              json.subdevices.push(item);
            }
          }
        });
      }

      var found = findPlugin(json.name);

      if (~found) {
        plugins[found] = json;
      } else {
        json.enabled = true;
        plugins.push(json);
      }

      writePluginsToStorage();

      if (init) {
        service.initPlugin(json);
      }

      return plugins;
    };

    service.removePlugin = function(plugin) {
      var deferred = $q.defer();

      plugins = plugins ? plugins : service.getPlugins();

      var found = findPlugin(plugin.name);

      if (~found) {
        plugins.splice(found, 1);
      }

      writePluginsToStorage();

      service.triggerPluginEvent(plugin, 'destroy');

      var deleted = false;
      plugin.subdevices
        .forEach(function(subdevice) {
          PluginInstances.deleteInstance(subdevice.uuid);
          deleted = true;
        });

      if (deleted)
        deferred.resolve();
      else
        deferred.reject();

      return deferred.promise;
    };

    service.init = function(){

      return retrievePlugins()
              .then(function(){
                var deferred = $q.defer();
                console.log('Plugins Done Loading');

                startListen();

                loaded = true;

                $rootScope.$emit('plugins-ready');

                deferred.resolve();

                return deferred.promise;
              });
    };

    service.ready = function() {
      var deferred = $q.defer();

      if (loaded) {
        deferred.resolve();
      } else {
        $rootScope.$on('plugins-ready', function() {
          deferred.resolve();
        });
      }

      return deferred.promise;
    };

    service.pluginIsLoaded = function(name) {
      return !!PluginInstances.findByType(name);
    };

    return service;

  });