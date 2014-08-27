'use strict';

angular.module('main.flows')
    .service('Topic', function(){
        return window.Skynet.Topics;
    });