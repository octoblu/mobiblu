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
      Skynet.ready().then(function(){
          Skynet.message(data)
          .then(callback, function() {
            console.log('Error Sending Message');
          });
      });
    };

    service.data = function(data, callback) {
      if (!callback) callback = function() {};
      console.log('Sending Data from Device');
      Skynet.ready().then(function(){
        Skynet.sendData(data)
          .then(callback, function() {
            console.log('Error Sending Message');
          });
      });
    };

    return service;


  });