'use strict';

angular.module('main.sensors')
  .service('SensorObj', function($window) {
  	// Private
    var limit = 50;

    function storeSensor(name, data) {
      var stored = $window.mobibluStorage.getItem(name) || [];
      stored.unshift(data);
      stored = stored.slice(0, limit);
      $window.mobibluStorage.setItem(name, stored);
      return stored;
    }

    function retrieveSensor(name) {
      return $window.mobibluStorage.getItem(name) || [];
    }

    function clearSensor(name) {
      return $window.mobibluStorage.removeItem(name);
    }

    // Public
  	function SensorObj(){

  	}

  	SensorObj.prototype.store = function(data){
      return storeSensor(this.name, data);
  	};

  	SensorObj.prototype.retrieve = function(){
      return retrieveSensor(this.name);
  	};

  	SensorObj.prototype.clearStorage = function(){
      return clearSensor(this.name);
  	};


  	return SensorObj;
  });