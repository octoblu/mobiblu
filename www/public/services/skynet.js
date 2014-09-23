'use strict';

angular.module('main.skynet')
  .service('Skynet', function($rootScope, $window, $q, Auth, Push, BGLocation, SkynetRest, Sensors, Activity, $location) {

    var service = {};

    var ls = window.localStorage;
    var ms = window.mobibluStorage;

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

    service.conn = null;

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
        $window.loggedin = ls.getItem('loggedin');

        if ($window.loggedin === 'true') {
          $window.loggedin = true;
        } else if ($window.loggedin === 'false') {
          $window.loggedin = false;
        } else {
          $window.loggedin = !!$window.loggedin;
        }

        //Push ID
        service.pushID = ls.getItem('pushID');
        // Mobile App Data
        service.mobileuuid = ms.getItem('mobileuuid');
        service.mobiletoken = ms.getItem('mobiletoken');

        var devicename = ms.getItem('devicename');

        console.log('Device Name: ' + JSON.stringify(devicename));

        if (devicename && devicename.length) {
          service.devicename = devicename;
        } else {
          var platform = window.device ? ' ' + window.device.platform : '';
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

      service.socketid = null;

      return true;
    }

    function connect() {
      console.log('Connecting to skynet...');
      var deferred = $q.defer();
      function connected() {
        console.log('Connected');

        deferred.resolve();
      }

      function notConnected(e, conn) {
        if (e) {
          console.log('Error Connecting to Skynet: ' + e.toString());
        }
        if (conn) {
          service.registerDevice()
            .done(deferred.resolve, deferred.reject);
        } else {
          deferred.reject(e);
        }
      }
      service.skynet(connected, notConnected);

      return deferred.promise;
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

      service.conn.on('message', function(data) {

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

    function regData() {
      var data = {
        'name': service.devicename,
        'owner': service.skynetuuid,
        'type': 'octobluMobile',
        'online': true
      };

      if (service.mobileuuid && service.mobiletoken) {
        data.uuid = service.mobileuuid;
        data.token = service.mobiletoken;
      }

      if (service.pushID) data.pushID = service.pushID;

      return data;
    }

    function _startListen() {
      service.conn.on('message', function(message) {

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

    // Register New Device
    service.registerDevice = function(newDevice) {

      console.log('Registering...');

      var deferred = $q.defer();

      var newDeviceData = regData();

      if (newDevice) {
        delete newDeviceData.uuid;
        delete newDeviceData.token;
      }

      console.log('Registration Data: ', JSON.stringify(newDeviceData));

      service.conn.register(
        newDeviceData,
        function(data) {
          if (newDevice) {
            service.conn.identify();
          }
          console.log('Registration Response: ', JSON.stringify(data));
          ms.setItem('mobileuuid', data.uuid);
          ms.setItem('mobiletoken', data.token);
          ms.setItem('devicename', data.name);

          service.mobileuuid = data.uuid;
          service.mobiletoken = data.token;
          service.devicename = data.name;

          deferred.resolve();
        });
      return deferred.promise;
    };

    service.skynet = function(callback, errorCallback) {

      console.log('Connecting Creds: ' + JSON.stringify([service.mobileuuid, service.mobiletoken]));

      var config = {
        port: window.mobibluConfig.SKYNET_PORT,
        server: 'ws://' + window.mobibluConfig.SKYNET_HOST
      };

      if (service.mobileuuid && service.mobiletoken) {
        config = _.extend(config, {
          uuid: service.mobileuuid,
          token: service.mobiletoken
        });
      }

      var conn = skynet.createConnection(config);

      conn.on('ready', function(data) {

        service.conn = conn;

        console.log('Connected data: ' + JSON.stringify(data));

        service.socketid = data.socketid;

        ms.setItem('mobileuuid', data.uuid);
        ms.setItem('mobiletoken', data.token);

        service.mobileuuid = data.uuid;
        service.mobiletoken = data.token;

        console.log('Connected to skynet');
        callback(data);

      });

      conn.on('notReady', function(error) {
        console.log('Skynet notReady during connect');
        service.conn = conn;
        errorCallback(error, conn);
      });

      conn.on('error', function(error) {
        console.log('Skynet Error during connect');
        errorCallback(error);
      });
    };

    service.updateDeviceSetting = function(data) {
      if (!_.isObject(data)) data = {};
      var deferred = $q.defer();
      // Extend the data option
      data.uuid = service.mobileuuid;
      data.token = service.mobiletoken;
      data.online = true;
      data.owner = service.skynetuuid;
      data.pushID = service.pushID;
      data.platform = window.device ? window.device.platform : 'iOS';
      data.name = service.devicename = data.name || service.devicename;

      data.type = 'octobluMobile';

      ms.setItem('devicename', data.name);

      if (data.setting) {
        ms.setItem('settings', data.setting);
        service.settings = data.setting;
      }

      doBackground();

      delete data['$$hashKey'];

      console.log('Updating Device: ' + JSON.stringify(data));
      service.conn.update(data, function() {
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

      service.conn.message(data, function(d) {
        Activity.logActivity({
          type: 'sent_message',
          html: 'Sending Message: ' + JSON.stringify(data.payload) + toStr
        });
        deferred.resolve(d);
      });

      return deferred.promise;
    };

    service.subscribe = function(data, fn) {
      if (!data.uuid) data.uuid = service.mobileuuid;
      if (!data.token) data.token = service.mobiletoken;

      service.conn.subscribe(data, fn);
    };

    service.localDevices = function() {
      return new Promise(function(resolve) {
        service.conn.localdevices(resolve);
      });
    };

    service.myDevices = function() {
      return SkynetRest.myDevices();
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

      service.conn.data(data, deferred.resolve);

      return deferred.promise;
    };

    service.whoami = function(uuid, token) {
      var deferred = $q.defer();

      service.conn.whoami({
        uuid: uuid || service.mobileuuid,
        token: token || service.mobiletoken
      }, deferred.resolve);

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
      setData(uuid, token);
      window.loggedin = $window.loggedin = true;
    };

    service.logout = function() {

      window.loggedin = $window.loggedin = false;

      ls.removeItem('loggedin');
      ls.removeItem('skynetuuid');
      ls.removeItem('skynettoken');

      setData();
    };

    service.start = function(){
      var deferred = $q.defer();

      function onError(){
          console.log('Unable to load the Skynet Module');

          Activity.logActivity({
            type: 'meshblu',
            html: 'Failed to connect to Meshblu'
          });

          deferred.reject();
      }
      $rootScope.loading = false;
      if($rootScope.isErrorPage() && $rootScope.matchRoute('/login')){
        // Doesn't need Auth
        deferred.reject();
      } else if(!service.isAuthenticated()){
        // Doesn't have credentials
        $location.path('/login');
        deferred.reject();
      } else {
        // Start Auth Flow
        return Auth.getCurrentUser()
                .then(function(currentUser){
                  console.log('Retrieved Current User');
                  var deferred = $q.defer();
                  if (currentUser && currentUser.skynet) {
                    setData(currentUser.skynet.uuid, currentUser.skynet.token);
                    deferred.resolve();
                  }else{
                    console.log('Bad Current User');
                    deferred.reject();
                  }
                  return deferred.promise;
                })
                .then(function(){
                  var deferred = $q.defer();
                  document.addEventListener('deviceready',function(){
                    console.log('Device Ready');
                    deferred.resolve();
                  });
                  return deferred.promise;
                }, onError)
                .then(connect)
                .then(function(){
                  postConnect();

                  console.log('Skynet Module Connected');

                  Activity.logActivity({
                    type: 'meshblu',
                    html: 'Connected to Meshblu'
                  });

                  $rootScope.$emit('skynet-ready');

                  $rootScope.setSettings();

                  $rootScope.isAuthenticated();

                  _startListen();

                  var deferred = $q.defer();
                  deferred.resolve();
                  return deferred.promise;
                }, onError);
      }
      return deferred.promise;
    };

    service.ready = function(cb) {
      var deferred = $q.defer();

      function done() {
        if (typeof cb === 'function') {
          cb(service.conn);
        }
        deferred.resolve(service.conn);
      }

      $rootScope.setSettings();

      if (service.loaded || $rootScope.isErrorPage() || $rootScope.matchRoute('/login')) {
        done();
      } else {
        $rootScope.$on('skynet-ready', function(){
          done();
        });
      }
      return deferred.promise;
    };

    service.getCurrentSettings = function() {

      if (!service.skynetuuid) {
        setData();
      }

      return {
        conn: service.conn,
        devicename: service.devicename,
        loggedin: $window.loggedin,
        mobileuuid: service.mobileuuid,
        mobiletoken: service.mobiletoken,
        skynetuuid: service.skynetuuid,
        skynettoken: service.skynettoken,
        settings: service.settings
      };
    };

    return service;

  });