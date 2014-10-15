'use strict';

angular.module('main.skynet')
  .service('Activity', function(Labels) {

    var service = {};

    var limit = 100;

    var debug = true;

    service.getActivity = function(type, limit) {

      var activity = window.mobibluStorage.getItem('skynetactivity') || [];

      if (!activity) {
        return [];
      }

      if (type) {
        activity = _.filter(activity, {
          type: type
        });
      }
      if (limit) {
        activity = activity.slice(0, limit);
      }
      //console.log('Activity', JSON.stringify(activity));
      return activity;

    };

    service.clearActivityCount = function() {
      service.x = 0;
      service.sensActBadge.text(service.x.toString());
      service.sensActBadge.removeClass('badge-negative');
      window.mobibluStorage.setItem('activitycount', service.x);
    };

    service.logActivity = function(data) {
      if (data.debug && !debug) {
        return;
      }
      Labels.getLabel(data.type)
        .then(function(type) {
          data.type = type;

          if (!service.skynetActivity ||
            !_.isArray(service.skynetActivity))
            service.skynetActivity = [];
          service.skynetActivity = service.skynetActivity.slice(0, limit);

          data = _.extend({
            date: new Date()
          }, data);

          if (service.skynetActivity.length)
            service.skynetActivity.unshift(data);
          else
            service.skynetActivity.push(data);

          if (data.error) {
            service.sensActBadge.text('Error');
            service.sensActBadge.addClass('badge-negative');
          } else {
            service.x++;
            service.sensActBadge.text(service.x.toString() + ' New');
            service.sensActBadge.removeClass('badge-negative');
          }

          window.mobibluStorage.setItem('skynetactivity', service.skynetActivity);
          window.mobibluStorage.setItem('activitycount', service.x);
          $(document).trigger('skynetactivity', data);

        });
    };

    service.init = function() {

      service.sensActBadge = $('#sensor-activity-badge'),
      service.x = window.mobibluStorage.getItem('activitycount') || 0;
      service.skynetActivity = service.getActivity();

    };


    return service;
  });