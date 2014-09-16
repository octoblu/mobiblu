'use strict';

angular.module('main.flows')
    .service('localTopics', function(){
        return window.Skynet.Topics;
    });