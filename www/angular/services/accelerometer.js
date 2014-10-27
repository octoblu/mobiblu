'use strict';

angular.module('main.sensors')
  .service('Accelerometer', function(SensorObj) {

    function Accelerometer(timeout) {
    	SensorObj.call(this);
      this.name = 'Accelerometer';
      this.watchID = null;
      this.timeout = timeout;
      this.stream = false;
      this.defaultMethod = 'watch';
      this.methodLabel = 'Watch';
    }

    Accelerometer.prototype = _.create(SensorObj.prototype, { 'constructor' : Accelerometer });

    Accelerometer.prototype.watch = function(onSuccess, onError) {
      var self = this,
        options = {
          frequency: self.timeout
        };
      self.watchID = navigator.accelerometer.watchAcceleration(function(data) {
        onSuccess(data, self.store(data));
      }, onError, options);
    };

    Accelerometer.prototype.start = function(onSuccess, onError) {
      var self = this;
      navigator.accelerometer.getCurrentAcceleration(function(data) {
          onSuccess(data, self.store(data));
        }, onError);
    };

    Accelerometer.prototype.clear = function() {
      var self = this;
      if (self.watchID) {
        navigator.accelerometer.clearWatch(self.watchID);
        self.watchID = null;
      }
    };

    Accelerometer.prototype.prettify = function(acceleration) {
      return 'Acceleration X: ' + acceleration.x + '<br>' +
        'Acceleration Y: ' + acceleration.y + '<br>' +
        'Acceleration Z: ' + acceleration.z + '<br>' +
        'Timestamp: ' + acceleration.timestamp + '<br>';
    };

    return Accelerometer;
  });