'use strict';

angular.module('main.skynet')
  .service('SkynetConn', function($q, SkynetRest, Config) {

  	var connections = {};

  	var service = {};

  	service.create = function(config){
  		var deferred = $q.defer();

      var conn = config.conn;

      config = _.omit(config, ['api', 'status', 'conn']);

  		SkynetRest.register(config).then(function(data){
        config = _.extend(config, data);
        conn.identify();
        deferred.resolve();
      });

  		return deferred.promise;
  	};

  	service.connect = function(key, config){
  		var deferred = $q.defer();

      console.log('Connecting [' + key + ']: ' + JSON.stringify([config.uuid, config.token]));

      config = _.extend(config, {
        port: Config.SKYNET_PORT,
        server: 'ws://' + Config.SKYNET_HOST,
        forceNew: true
      });

      var conn = skynet.createConnection(config);

      conn.on('ready', function(data) {
        console.log('Connected [' + key + ']');

      	config = _.extend(config, data);

      	config.conn = conn;

       	connections[key] = config;

        deferred.resolve(config);
      });

      conn.on('notReady', function(error) {
        console.log('Connection notReady [' + key + ']', error);
        config.conn = conn;

       	connections[key] = config;

        deferred.reject(config);
      });

      conn.on('error', function(error) {
        console.log('Connection error [' + key + ']', error);
        deferred.reject(error);
      });

      return deferred.promise;
  	};

  	service.getConfig = function(key){
  		return connections[key];
  	};

  	service.get = function(key){
  		return connections[key] ? connections[key].conn : null;
  	};

  	service.getUuid = function(key){
  		return connections[key] ? connections[key].uuid : null;
  	};

  	service.getToken = function(key){
  		return connections[key] ? connections[key].token : null;
  	};

  	return service;
  });