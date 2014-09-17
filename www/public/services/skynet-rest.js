'use strict';

angular.module('main.skynet')
  .service('SkynetRest', function($q, Config, $http) {

    var timeout = 10 * 1000;
    var baseURL = Config.SKYNET_URL;

    var uuid, token;

    function getAjax(params) {
      uuid = window.localStorage.getItem('skynetuuid');
      token = window.localStorage.getItem('skynettoken');

      var ajaxParams = {
        method: 'GET',
        headers: {
          skynet_auth_uuid: uuid,
          skynet_auth_token: token
        },
        timeout: timeout,
        contentType: "application/json; charset=utf-8"
      };

      var p = _.extend(ajaxParams, params);

      console.log('Ajax Params', JSON.stringify(p));

      return p;
    }

    var service = {};

    service.getDevice = function(uuid, token) {
      var deferred = $q.defer();

      if (!uuid && !token) {
        deferred.resolve();
      }
      $http(getAjax({
        url: baseURL + '/devices/' + uuid,
        headers: {
          skynet_auth_uuid: uuid,
          skynet_auth_token: token
        }
      }))
        .success(function(res) {
          deferred.resolve(res.data);
        })
        .error(deferred.reject);
      return deferred.promise;
    };

    service.sendData = function(uuid, token, data) {
      var deferred = $q.defer();

      var obj = {
        url: baseURL + '/data/' + uuid,
        method: 'POST',
        data: JSON.stringify(data)
      };

      if (uuid && token) {
        obj.headers = {
          skynet_auth_uuid: uuid,
          skynet_auth_token: token
        };
      }

      $http(getAjax(obj))
        .success(function(res) {
          deferred.resolve(res.data);
        })
        .error(deferred.reject);

      return deferred.promise;
    };

    service.localDevices = function() {
      var deferred = $q.defer();
      $http(getAjax({
        url: baseURL + '/localdevices',
        method: 'GET'
      }))
        .success(function(res) {
          deferred.resolve(res.data);
        })
        .error(deferred.reject);
      return deferred.promise;
    };

    service.myDevices = function() {
      var deferred = $q.defer();
      $http(getAjax({
        url: baseURL + '/mydevices',
        method: 'GET'
      }))
        .success(deferred.resolve)
        .error(deferred.reject);
      return deferred.promise;
    };

    service.claimDevice = function(deviceUuid, mobileuuid, mobiletoken) {
      var deferred = $q.defer();

      service.getIPAddress()
        .then(function(data) {
          var ip = data.ipAddress;
          if (!ip) {
            deferred.reject('Couldn\'t get an IP Address');
          } else {
            $http(getAjax({
              url: baseURL + '/claimdevice/' + deviceUuid,
              method: 'PUT',
              headers: {
                skynet_auth_uuid: mobileuuid,
                skynet_auth_token: mobiletoken,
              }
            }))
              .success(function(res) {
                deferred.resolve(res.data);
              })
              .error(deferred.reject);
          }

        }, deferred.reject);

      return deferred.promise;
    };

    service.deleteDevice = function(device) {
      var deferred = $q.defer();

      $http(getAjax({
        url: baseURL + '/devices/' + device.uuid,
        method: 'DELETE',
        contentType: null
      }))
        .success(function(res) {
          deferred.resolve(res.data);
        })
        .error(deferred.reject);
      return deferred.promise;
    };

    service.editDevice = function(device) {
      var deferred = $q.defer();

      var omit = [
        '_id',
        'id',
        'autoRegister',
        'channel',
        'ipAddress',
        'protocol',
        'secure',
        'socketid',
        '$$hashKey'
      ];
      var params = _.omit(device, omit);

      $http(getAjax({
        url: baseURL + '/devices/' + device.uuid,
        method: 'PUT',
        data: JSON.stringify(params)
      }))
        .success(function(res) {
          deferred.resolve(res.data);
        })
        .error(deferred.reject);
      return deferred.promise;
    };

    service.logout = function(uuid, token) {
      var deferred = $q.defer();
      $http({
        url: Config.OCTOBLU_URL + '/api/auth',
        method: 'DELETE',
        headers: {
          skynet_auth_uuid: uuid,
          skynet_auth_token: token
        },
        timeout: timeout
      })
        .success(function(res) {
          deferred.resolve(res.data);
        })
        .error(deferred.reject);
      return deferred.promise;
    };

    service.getIPAddress = function() {
      var deferred = $q.defer();
      $http(getAjax({
        url: baseURL + '/ipaddress',
        method: 'GET'
      }))
        .success(function(res) {
          deferred.resolve(res.data);
        })
        .error(deferred.reject);
      return deferred.promise;
    };

    return service;

  });