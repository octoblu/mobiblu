'use strict';

angular.module('main.plugins')
  .service('PublicAPI', function(Activity) {
    return {
      logActivity: Activity.logActivity
    };
  });