'use strict';

angular.module('main.skynet')
  .service('Skynet', function($rootScope, $window, $q, Auth, SkynetConn, Config, Push, BGLocation, SkynetRest, Sensors, Activity, $location, reservedProperties) {

    var service = {};

    var ls = $window.localStorage;
    var ms = $window.mobibluStorage;

    service.loaded = false;

    service.defaultSettings = {
      compass: false,
      accelerometer: false,
      geolocation: false,
      update_interval: 3,
      bg_updates: false,
      developer_mode: false
    };

    service.bgRunning = false;

    service.settingsUpdated = false;

    service.dataTimeout = null;

    service.dataQueue = [];

    service.dataLastSent = null;

    function setData(skynetuuid, skynettoken) {
      if (!skynetuuid) {
        skynetuuid = ls.getItem('skynetuuid');
      }
      if (!skynettoken) {
        skynettoken = ls.getItem('skynettoken');
      }

      // Set new Skynet Tokens
      if (skynetuuid && skynettoken) {
        console.log('Octoblu Credentials');

        ms.writeConfig({
          user: skynetuuid
        });

        // Octoblu User Data
        service.skynetuuid = skynetuuid;
        service.skynettoken = skynettoken;
        // Logged In
        $window.loggedin = !!ls.getItem('loggedin');

        //Push ID
        service.pushID = ls.getItem('pushID');
        // Mobile App Data
        service.mobileuuid = ms.getItem('mobileuuid');
        service.mobiletoken = ms.getItem('mobiletoken');

        service.devicename = ms.getItem('devicename');

        if (!service.devicename) {
          var platform = $window.device ? ' ' + $window.device.platform : '';
          service.devicename = 'Mobiblu' + platform;
        }

        service.settings = ms.getItem('settings') || {};
        if (_.isEmpty(service.settings)) {
          service.settings = service.defaultSettings;
        } else {
          service.settingsUpdated = true;
        }
      }

      console.log('Owner UUID : ' + JSON.stringify(service.skynetuuid));

      console.log('Mobile Data Credentials : ' + JSON.stringify([service.mobileuuid, service.mobiletoken]));

      return true;
    }

    function createMobibluIfNeeded(config) {
      var deferred = $q.defer();
      if (config.conn) {
        if(config.uuid !== service.skynetuuid){
          config.owner = service.skynetuuid;
        }
        return SkynetConn.create(config);
      } else {
        deferred.reject();
      }
      return deferred.promise;
    }

    function updateMobileConfig(config) {
      console.log('Setting Mobiblu Config', config);
      ms.setItem('mobileuuid', config.uuid);
      ms.setItem('mobiletoken', config.token);

      service.mobileuuid = config.uuid;
      service.mobiletoken = config.token;
      return $q.when(config);
    }

    function doBackground() {
      if (service.bgRunning && !service.settings.bg_updates) {
        BGLocation.stopBG(service);
      } else if (!service.bgRunning) {
        BGLocation.startBG(service);
      }
    }

    function postConnect() {

      service.loaded = true;

      doBackground();

      service.registerPushID()
        .then(function() {
          if (service.pushID) console.log('Push ID Registered (end)');
        }, function(err) {
          console.log(err);
          Activity.logActivity({
            type: 'push',
            error: 'Unable to enable Push Notifications'
          });
        });

      SkynetConn.get('mobiblu').on('message', function(data) {

        var message;
        if (typeof data.payload !== 'string') {
          message = JSON.stringify(data.payload);
        } else {
          message = data.payload;
        }

        console.log('On Message: ' + message);

        Activity.logActivity({
          type: 'message',
          html: 'From: ' + data.fromUuid +
            '<br>Message: ' + message
        });
      });

      Sensors.logSensorData(service);
    }

    function startListen() {
      SkynetConn.get('mobiblu').on('message', function(message) {

        $rootScope.$broadcast('skynet:message', message);

        var device = message.subdevice || message.fromUuid;

        $rootScope.$broadcast('skynet:message:' + device, message);
        if (message.payload && _.has(message.payload, 'online')) {
          device = _.findWhere($rootScope.myDevices, {
            uuid: message.fromUuid
          });
          if (device) {
            device.online = message.payload.online;
          }
        }

      });
    }

    function getDefaultMobibluDevice() {
      var data = {};
      // Extend the data option
      data.uuid = service.mobileuuid;
      data.token = service.mobiletoken;
      data.owner = service.skynetuuid;
      data.pushID = service.pushID;
      data.platform = $window.device ? $window.device.platform : 'iOS';
      data.name = service.devicename = data.name || service.devicename;

      data.type = 'octobluMobile';

      return data;
    }

    function getOctobluDevice() {
      return {
        uuid: service.skynetuuid,
        token: service.skynettoken
      };
    }

    function retrievedCurrentUser(currentUser) {
      console.log('Retrieved Current User');
      var deferred = $q.defer();
      if (currentUser && currentUser.skynet) {
        setData(currentUser.skynet.uuid, currentUser.skynet.token);
        deferred.resolve();
      } else {
        console.log('Bad Current User');
        deferred.reject();
      }
      return deferred.promise;
    }

    function deviceReady() {
      var deferred = $q.defer();
      document.addEventListener('deviceready', function() {
        console.log('Device Ready');
        deferred.resolve();
      });
      return deferred.promise;
    }

    function onConnectError() {

      var deferred = $q.defer();
      console.log('Unable to load the Skynet Module');

      Activity.logActivity({
        type: 'meshblu',
        html: 'Failed to connect to Meshblu'
      });

      deferred.reject();

      return deferred.promise;
    }

    function initializeModule() {
      return Auth.getCurrentUser()
        .then(retrievedCurrentUser)
        .catch(onConnectError)
        .then(deviceReady)
        .then(function() {
        	Activity.logActivity({
	          type: 'meshblu',
	          html: 'Connecting to Meshblu...'
	        });
          return SkynetConn.connect('octoblu', getOctobluDevice());
        })
        .then(function() {
          return SkynetConn.connect('mobiblu', getDefaultMobibluDevice());
        })
        .catch(function(config) {
          console.log('Failed to Connect');
          return createMobibluIfNeeded(config);
        })
        .then(function(config){
          console.log('Connected Sockets');
          return updateMobileConfig(config);
        })
        .catch(onConnectError)
        .then(function() {
          postConnect();

          console.log('Skynet Module Connected');

          Activity.logActivity({
            type: 'meshblu',
            html: 'Connected to Meshblu'
          });

          $rootScope.$emit('skynet-ready');

          $rootScope.setSettings();

          $rootScope.isAuthenticated();

          startListen();

          var deferred = $q.defer();
          deferred.resolve();
          return deferred.promise;
        });
    }

    service.isAuthenticated = function() {
      return !!($window.loggedin && service.skynetuuid && service.skynettoken);
    };

    service.hasAuth = function() {
      return !!(service.skynetuuid && service.skynettoken);
    };

    service.registerPushID = function() {
      return new Push(service).then(function(pushID) {
        return new Promise(function(resolve) {
          service.pushID = pushID;
          resolve();
        });
      });
    };

    service.updateMobibluSetting = function(data) {
      if (!_.isObject(data)) data = {};
      var deferred = $q.defer();

      data = _.extend(getDefaultMobibluDevice(), data);
      data.online = true;
      if(data.name){
      	service.devicename = data.name;
	      ms.setItem('devicename', data.name);
      }

      if (data.setting) {
        ms.setItem('settings', data.setting);
        service.settings = data.setting;
      }

      doBackground();

      var device = _.omit(data, reservedProperties);

      console.log('Updating Device: ' + JSON.stringify(data));
      SkynetConn.get('mobiblu').update(device, function() {
        console.log('Device Updated');
        deferred.resolve();
      });

      return deferred.promise;
    };

    service.message = function(data) {
      var deferred = $q.defer();
      if (!data.uuid) data.uuid = service.mobileuuid;
      if (!data.token) data.token = service.mobiletoken;
      var toStr = '';
      if (data.devices) {
        toStr += '<br>' + 'To UUID: ';
        if (typeof data.devices === 'string') {
          toStr += data.devices;
        } else {
          toStr += JSON.stringify(data.devices);
        }
      }

      SkynetConn.get('mobiblu').message(data, function(d) {
        Activity.logActivity({
          type: 'sent_message',
          html: 'Sending Message: ' + JSON.stringify(data.payload) + toStr
        });
        deferred.resolve(d);
      });

      return deferred.promise;
    };

    service.sendData = function(data) {
      var deferred = $q.defer();

      var defaults = {
        'uuid': service.mobileuuid,
        'token': service.mobiletoken
      };
      data = _.extend(defaults, data);

      var eventName = 'sensor';
      if (data.sensorData && data.sensorData.type) {
        eventName += ':' + data.sensorData.type;
      } else if (data.device) {
        eventName += ':' + data.device;
      } else if (data.subdevice) {
        eventName += ':' + data.subdevice;
      } else if (data.name) {
        eventName += ':' + data.name;
      }

      $(document).trigger(eventName, data);

      SkynetConn.get('mobiblu').data(data, deferred.resolve);

      return deferred.promise;
    };

    service.getDeviceSetting = function(uuid, token) {
      var deferred = $q.defer();

      if (service.settingsUpdated) {
        deferred.resolve({
          setting: service.settings
        });
      } else {
        SkynetRest.getDevice(
          uuid || service.mobileuuid,
          token || service.mobiletoken)
          .then(function(data) {
            var device;

            if (!data) return deferred.reject('No Device Found');

            if (data.devices && data.devices.length) {
              device = data.devices[0];
            } else {
              device = data;
            }
            if (!uuid || uuid !== service.mobileuuid) {
              if (device.setting) {
                service.settingsUpdated = true;
                service.settings = device.setting;
              } else {
                service.settings = service.defaultSettings;
              }
            }

            deferred.resolve(device);
          }, function(err) {
            console.log(err);
            deferred.reject('Unable to Retrieve Device');
          });
      }

      return deferred.promise;
    };

    service.login = function(uuid, token) {
    	ls.setItem('skynetuuid', uuid);
      ls.setItem('skynettoken', token);
      ls.setItem('loggedin', true);

      setData(uuid, token);
      $window.loggedin = $rootScope.loggedin = true;
    };

    service.logout = function() {

      $window.loggedin = $rootScope.loggedin = false;

      ls.removeItem('loggedin');
      ls.removeItem('skynetuuid');
      ls.removeItem('skynettoken');

      setData();
    };

    service.start = function() {
      var deferred = $q.defer();

      $rootScope.loading = false;
      if ($rootScope.isErrorPage() && $rootScope.matchRoute('/login')) {
        // Doesn't need Auth
        deferred.reject();
      } else if (!service.isAuthenticated()) {
        // Doesn't have credentials
        $location.path('/login');
        deferred.reject();
      } else {
        // Start Auth Flow
        initializeModule()
          .then(deferred.resolve, deferred.reject);
      }
      return deferred.promise;

    };

    service.ready = function(cb) {
      var deferred = $q.defer();

      if (!_.isFunction(cb)) {
        cb = deferred.resolve;
      }

      function done() {
        var conn = SkynetConn.get('octoblu');
        if (conn) {
          cb(conn);
        } else {
          deferred.reject();
        }
      }

      $rootScope.setSettings();

      if (service.loaded ||
        $rootScope.isErrorPage() ||
        $rootScope.matchRoute('/login')) {
        // No need to be cool
        done();
      } else {
        // Wait for it to be ready
        $rootScope.$on('skynet-ready', function() {
          done();
        });
      }
      return deferred.promise;
    };

    setData();

    return service;

  });