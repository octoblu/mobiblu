'use strict';

angular.module('main.plugins')
  .service('PluginInstances', function($q, $window, Messenger, PublicAPI) {

    var service = {},
      instances = {};

    service.find = function(match) {
      var foundKey = null;

      _.each(_.keys(instances), function(key) {
        var ins = instances[key];
        if (ins.uuid === match || ins.name === match) {
          foundKey = key;
        }
      });

      return instances[foundKey];
    };


    service.findByType = function(type) {
      var foundKey = null;

      _.each(_.keys(instances), function(key) {
        var ins = instances[key];
        if (ins.type === type) {
          foundKey = key;
        }
      });

      return instances[foundKey];
    };

    service.deleteInstance = function(uuid) {
      delete instances[uuid];
    };

    service.clear = function() {
      instances = {};
    };

    service.initDevice = function(subdevice, callback) {
      console.log('INIT DEVICE = ' + subdevice.name + ' :: type = ' + subdevice.type + ':: uuid = ' + subdevice.uuid);

      var pluginObj;

      var globalPlugins = $window.skynetPlugins;

      var camelName = subdevice.type.toCamel();

      var p = globalPlugins && globalPlugins[camelName] ? globalPlugins[camelName] : null;

      try {

        var deviceInfo = {
          uuid: subdevice.uuid,
          name: subdevice.name
        };

        pluginObj = new p.Plugin(
          Messenger,
          subdevice.options || {},
          PublicAPI,
          deviceInfo
        );

        callback(p);

      } catch (e) {
        console.log('Error Initing', e);
        pluginObj = null;
      }

      if (p && p.getDefaultOptions) {
        pluginObj.getDefaultOptions = p.getDefaultOptions;
      }

      if (pluginObj) {
        console.log('Device Init\'d');
        instances[subdevice.uuid] = pluginObj;
      } else {
        console.log('Plugin Obj Not Found');
      }


      return pluginObj;
    };

    service.triggerDeviceEvent = function(subdevice, event) {

      var deferred = $q.defer();

      var Plugin = instances[subdevice.uuid];

      if (Plugin) {

        if (_.isFunction(Plugin[event])) {

          try {
            Plugin[event].call(Plugin, deferred.resolve);
          } catch (e) {
            deferred.resolve('Error Triggering Event');
            return;
          }

          deferred.resolve();
        } else {
          deferred.resolve('No event found for plugin');
        }

      } else {
        deferred.resolve('No plugin found :: ' + subdevice.name + ' :: uuid = ' + subdevice.uuid);
      }

      return deferred.promise;

    };

    return service;

  });