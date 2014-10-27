'use strict';

angular.module('main.sensors')
  .service('Compass', function(SensorObj) {

    function Compass(timeout) {
    	SensorObj.call(this);
      this.name = 'Compass';
      this.watchID = null;
      this.timeout = timeout;
      this.stream = false;
      this.defaultMethod = 'watch';
      this.methodLabel = 'Watch';
    }

    Compass.prototype = _.create(SensorObj.prototype, { 'constructor' : Compass });

    Compass.prototype.watch = function(onSuccess, onError) {
      var self = this,
        options = {
          frequency: self.timeout
        };
      self.watchID = navigator.compass.watchHeading(function(data) {
        onSuccess(data, self.store(data));
      }, onError, options);
    };

    Compass.prototype.start = function(onSuccess, onError) {
      var self = this;
      navigator.compass.getCurrentHeading(function(data) {
          onSuccess(data, self.store(data));
        }, onError);
    };

    Compass.prototype.clear = function() {
      var self = this;
      if (self.watchID) {
        navigator.compass.clearWatch(self.watchID);
        self.watchID = null;
      }
    };

    Compass.prototype.prettify = function(heading) {
      return 'Heading: ' + heading.magneticHeading + '<br />';
    };

    return Compass;
  });