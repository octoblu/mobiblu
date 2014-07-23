'use strict';

angular.module('main.labels')
    .service('Labels', function(){
        return window.Skynet.labels;
    });