'use strict';

angular.module('main', [
    'ngRoute',
    'ui.route',
    'main.system',
    'main.home',
    'main.sensors',
    'main.plugins',
    'main.flows',
    'main.messages',
    'main.setting'
]).run(function ($rootScope, $location, $q) {

    var loaded = false;

    $rootScope.loading = true;

    $rootScope.Skynet = window.Skynet;

    $rootScope.matchRoute = function (route) {
        var regex = new RegExp('\\#\\!' + route);
        if (window.location.href.match(regex)) {
            return true;
        }
        return false;
    };

    $rootScope.errorMsg = null;

    $rootScope.redirectToError = function (err) {
        $rootScope.loading = false;
        $rootScope.errorMsg = err || '';
        $location.path('/error');
    };

    var skynetLoad = function (cb) {
        var deferred = $q.defer();
        $(document).on('skynet-loaded', function () {
            loaded = true;
            console.log('SKYNET LOADED EVENT :: ' + JSON.stringify(loaded));
            deferred.resolve();
        });

        return deferred.promise;
    };

    $rootScope.ready = function (cb) {
        if (loaded) cb();
        else skynetLoad().then(cb, $rootScope.redirectToError);
    };

    $rootScope.setSettings = function () {
        $rootScope.settings = $rootScope.Skynet.getCurrentSettings();

        $rootScope.loggedin = $rootScope.settings.loggedin;
    };

    $rootScope.isAuthenticated = function () {
        if (!$rootScope.loggedin) {
            if (!$rootScope.matchRoute('/login')) $location.path('/login');
            return false;
        } else {
            return true;
        }
    };


    var skynetInit = function () {
        var deferred = $q.defer();

        $rootScope.Skynet.init().timeout(1000 * 15)
            .then(function () {
                console.log('SKYNET INIT\'d');
                deferred.resolve();
            }, $rootScope.redirectToError);

        return deferred.promise;
    };

    skynetInit().then(function () {
            console.log('SKYNET LOADED');

            $rootScope.Sensors = $rootScope.Skynet.Sensors;

            $rootScope.setSettings();

            $rootScope.$on('$locationChangeSuccess', function () {
                $rootScope.settings = $rootScope.Skynet.getCurrentSettings();
            });

            $rootScope.isAuthenticated();

            $rootScope.loading = false;

        },
        $rootScope.redirectToError);

    skynetLoad();

    $rootScope.setSettings();

    $rootScope.isAuthenticated();

});

angular.module('main.system', []);
angular.module('main.home', []);
angular.module('main.messages', []);
angular.module('main.setting', []);
angular.module('main.sensors', ['ngSanitize']);
angular.module('main.plugins', []);
angular.module('main.flows', []);
