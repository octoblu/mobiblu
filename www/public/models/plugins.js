'use strict';

angular.module('main.plugins')
    .service('Plugins', function ($rootScope, $q) {

        var lib = window.octobluMobile;

        var pluginsLoaded = false;

        var _pluginReady = function () {
            var deferred = $q.defer();

            if (pluginsLoaded || window.octobluMobile.isLoaded()) {

                deferred.resolve();

            } else {

                $(document).on('plugins-loaded', function () {
                    console.log('Plugins Loaded');
                    pluginsLoaded = true;
                    deferred.resolve();
                });

            }

            return deferred.promise;
        };

        lib.ready = function () {
            return _pluginReady();
        };

        return lib;

    });