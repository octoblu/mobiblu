'use strict';

angular.module('main.sensors')
  .service('Geolocation', function(SensorObj) {

    function Geolocation(timeout) {
    	SensorObj.call(this);
      this.name = 'Geolocation';
      this.watchID = null;
      this.timeout = timeout;
      this.stream = false;
      this.defaultMethod = 'start';
      this.methodLabel = 'Send';
    }

    Geolocation.prototype = _.create(SensorObj.prototype, { 'constructor' : Geolocation });

    Geolocation.prototype.watch = function(onSuccess, onError) {
      var self = this,
        options = {
          frequency: self.timeout
        };
      self.watchID = navigator.geolocation.watchPosition(function(data) {
        onSuccess(data, self.store(data));
      }, onError, options);
    };

    Geolocation.prototype.start = function(onSuccess, onError) {
      var self = this;
      navigator.geolocation.getCurrentPosition(function(data) {
          onSuccess(data, self.store(data));
        }, onError);
    };

    Geolocation.prototype.clear = function() {
      var self = this;
      if (self.watchID) {
        navigator.geolocation.clearWatch(self.watchID);
        self.watchID = null;
      }
    };

    Geolocation.prototype.prettify = function(position) {
      return 'Latitude: ' + position.coords.latitude + '<br />' +
            'Longitude: ' + position.coords.longitude + '<br />';
    };

    return Geolocation;
  });