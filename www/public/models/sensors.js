'use strict';

angular.module('main.sensors')
    .service('Sensors', function () {

        var lib = window.Skynet.Sensors;

        return lib;

    });