'use strict';

angular.module('main.plugins')
  .service('Messenger', function($rootScope, Skynet) {

    var service = {};

    // Called Every Time the Messenger is needed
    service.init = function() {
      return service;
    };

    service.send = function(data, callback) {
      if (!callback) callback = function() {};
      if (Skynet.conn) {
        Skynet.message(data)
          .then(callback, function() {
            console.log('Error Sending Message');
          });
      } else {
        callback(new Error('Socket not available'));
      }
    };

    service.data = function(data, callback) {
      if (!callback) callback = function() {};
      console.log('Sending Data from Device');
      if (Skynet.conn) {
        Skynet.sendData(data)
          .then(callback, function() {
            console.log('Error Sending Message');
          });
      } else {
        callback(new Error('Socket not available'));
      }
    };

    return service;


  });