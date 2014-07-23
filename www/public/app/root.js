'use strict';

angular.module('main')
    .run(function ($rootScope, $location, $q) {

        var loaded = false;

        var timeouts = [];

        $rootScope.loading = true;

        $rootScope.Skynet = window.Skynet;

        $rootScope.isDeveloper = false;

        $rootScope.matchRoute = function (route) {
            var regex = new RegExp('\\#\\!' + route);
            if (window.location.href.match(regex)) {
                return true;
            }
            return false;
        };

        var clearAppTimeouts = function () {
            timeouts.forEach(function (timeout, i) {
                clearTimeout(timeout);
                timeouts.splice(i, 1);
            });
        };

        $rootScope.errorMsg = null;

        var isErrorPage = function () {
            if ($rootScope.matchRoute('/error') ||
                $rootScope.matchRoute('/login')) {
                return true;
            }
            return false;
        };

        var redirectToError = function (err, type) {
            if (isErrorPage()) return false;
            clearAppTimeouts();
            console.log('Error! ', err);
            console.log('Redirecting to "' + type + '" Error');
            setTimeout(function () {
                $rootScope.$apply(function () {
                    $rootScope.loading = false;
                    $rootScope.errorMsg = err || '';
                    $location.path('/error/' + type);
                });
            }, 0);
        };

        $rootScope.redirectToError = function (err) {
            redirectToError(err, 'basic');
        };

        $rootScope.redirectToCustomError = function (err) {
            redirectToError(err, 'custom');
        };

        $rootScope.redirectToLoginError = function (err) {
            redirectToError(err, 'login');
        };

        $rootScope.$on('$locationChangeSuccess', function () {
            clearAppTimeouts();
            timeouts.push(setTimeout(function () {
                console.log('Loading :: ' + $rootScope.loading);
                if ($rootScope.loading) {
                    $rootScope.redirectToError('Request Timeout.');
                }
            }, 1000 * 20));
        });

        var skynetLoad = _.once(function () {
            var deferred = $q.defer();
            $(document).one('skynet-loaded', function () {
                loaded = true;
                deferred.resolve();
            });

            timeouts.push(setTimeout(deferred.reject, 1000 * 15));

            return deferred.promise;
        });

        $rootScope.ready = function (cb) {
            $rootScope.setSettings();
            if (loaded || isErrorPage()) cb();
            else skynetLoad().then(cb, $rootScope.redirectToError);
        };

        $rootScope.setSettings = function () {
            $rootScope.settings = $rootScope.Skynet.getCurrentSettings();

            $rootScope.loggedin = $rootScope.settings.loggedin;

            $rootScope.isDeveloper = $rootScope.settings.settings.developer_mode;

            $rootScope.skynetConn = $rootScope.settings.conn;

            $rootScope.Sensors = $rootScope.Skynet.Sensors;

        };

        $rootScope.isAuthenticated = function () {
            if (!$rootScope.loggedin) {
                if (!$rootScope.matchRoute('/login')) $location.path('/login');
                return false;
            } else {
                return true;
            }
        };

        var pluginsLoaded = false;

        var pluginReady = _.once(function () {
            var deferred = $q.defer();

            if (pluginsLoaded || isErrorPage()) {

                deferred.resolve();

            } else {
                $(document).one('plugins-loaded', function () {
                    console.log('Plugins Loaded');
                    pluginsLoaded = true;
                    deferred.resolve();
                });
            }

            timeouts.push(setTimeout(deferred.reject, 1000 * 15));

            return deferred.promise;
        });

        $rootScope.pluginReady = function (cb) {
            pluginReady().then(function () {
                cb();
            }, $rootScope.redirectToError);
        };

        var skynetInit = function () {
            var deferred = $q.defer();

            if (isErrorPage()) {
                deferred.reject();
            } else {
                $rootScope.Skynet.init()
                    .timeout(1000 * 15)
                    .then(function () {
                        deferred.resolve();
                    }, $rootScope.redirectToError);
            }
            return deferred.promise;
        };

        var processMessage = function (message) {
            $rootScope.$broadcast('skynet:message', message);
            var device = message.subdevice || message.fromUuid;
            $rootScope.$broadcast('skynet:message:' + device, message);
            if (message.payload && _.has(message.payload, 'online')) {
                var device = _.findWhere($rootScope.myDevices, {uuid: message.fromUuid});
                if (device) {
                    device.online = message.payload.online;
                }
            }
        };

        var startListen = function () {
            console.log('registering for messages');
            $rootScope.skynetConn.on('message', processMessage);
        };

        skynetInit()
            .then(function () {
                console.log('SKYNET LOADED');

                $rootScope.setSettings();

                startListen();

                $rootScope.isAuthenticated();

                $rootScope.loading = false;

            }, $rootScope.redirectToError);

        skynetLoad();

        $rootScope.setSettings();

        $rootScope.isAuthenticated();

    });