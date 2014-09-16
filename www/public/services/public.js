'use strict';

angular.module('main.plugins')
  .service('PublicAPI', function(Skynet) {
    return {
      logActivity: Skynet.logActivity
    };
  });