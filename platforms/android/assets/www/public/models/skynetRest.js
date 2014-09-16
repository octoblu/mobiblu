'use strict';

angular.module('main.skynet')
    .service('SkynetRest', function () {

        var lib = window.Skynet.SkynetRest;

        return lib;

    });