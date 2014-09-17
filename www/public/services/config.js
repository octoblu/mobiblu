'use strict';

angular.module('main.system')
    .service('Config', function(){
        return window.mobibluConfig;
    });