'use strict';

angular.module('main.labels')
  .service('Labels', function($q) {
    var service = {};

    var loaded = false;

    service.labels = {};

    service.getLabels = function() {
      var deferred = $q.defer();

      if (loaded) {
        deferred.resolve(service.labels);
      } else {
        $.getJSON('/data/labels.json')
          .success(function(data) {
            loaded = true;
            service.labels = data;
            deferred.resolve(data);
          })
          .error(deferred.reject);
      }

      return deferred.promise;
    };

    service.getLabel = function(lbl) {
      var deferred = $q.defer();

      service.getLabels()
        .then(function() {
          var label = service.labels[lbl] || lbl;
          deferred.resolve(label);
        }, function() {
          deferred.resolve(lbl);
        });

      return deferred.promise;
    };

    return service;
  });