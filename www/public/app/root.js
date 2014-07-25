'use strict';

angular.module('main')
    .run(function ($rootScope, $location, $q, Auth) {

        var loaded = false;

        var timeouts = [];

        $rootScope.loading = true;

        $rootScope.Skynet = window.Skynet;

        $rootScope.isDeveloper = false;

        $rootScope.matchRoute = function (route) {
            var regex = new RegExp('\\#\\!' + route);
            if (window.location.href.split('?')[0].match(regex)) {
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
            if ($rootScope.matchRoute('/error')) {
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

        $rootScope.setSettings = function () {
            $rootScope.settings = $rootScope.Skynet.getCurrentSettings();

            $rootScope.loggedin = $rootScope.settings.loggedin;

            $rootScope.isDeveloper = $rootScope.settings.settings ? $rootScope.settings.settings.developer_mode : false;

            $rootScope.skynetConn = $rootScope.settings.conn;

            $rootScope.Sensors = $rootScope.Skynet.Sensors;

        };

        $rootScope.isSettingUser = function(){
            var uuid = getParam('uuid'), token = getParam('token');

            if(uuid && token){
                return true;
            }else{
                return false;
            }
        };

        $rootScope.isAuthenticated = function () {
            if (!$rootScope.loggedin && !$rootScope.matchRoute('/set')) {
                if (!$rootScope.matchRoute('/login')) {
                    console.log('Redirecting to login');
                    $location.path('/login');
                }
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

        var _skynetInit = function () {
            var deferred = $q.defer();
            if (isErrorPage()) {
                deferred.resolve();
            } else {
                var currentUser = {};
                if ($rootScope.loggedin || $rootScope.matchRoute('/set')) {
                    currentUser = Auth.getCurrentUser();
                }
                var uuid, token;
                if (currentUser && currentUser.skynet) {
                    uuid = currentUser.skynet.uuid;
                    token = currentUser.skynet.token;
                }

                $rootScope.Skynet.init(uuid, token)
                    .timeout(1000 * 15)
                    .then(function () {
                        deferred.resolve();
                    }, $rootScope.redirectToError);
            }
            return deferred.promise;
        };

        var _skynetLoad = _.once(function () {

            var deferred = $q.defer();

            $(document).one('skynet-loaded', function () {
                loaded = true;
                deferred.resolve();
            });

            return deferred.promise;
        });

        $rootScope.ready = function (cb) {
            $rootScope.setSettings();
            if (loaded || isErrorPage()) cb();
            else _skynetLoad().then(cb, $rootScope.redirectToError);
        };

        var _startListen = function () {
            $rootScope.skynetConn.on('message', function (message) {

                $rootScope.$broadcast('skynet:message', message);

                var device = message.subdevice || message.fromUuid;

                $rootScope.$broadcast('skynet:message:' + device, message);
                if (message.payload && _.has(message.payload, 'online')) {
                    var device = _.findWhere($rootScope.myDevices, {uuid: message.fromUuid});
                    if (device) {
                        device.online = message.payload.online;
                    }
                }

            });
        };

        $rootScope.skynetInit = function () {
            _skynetInit()
                .then(function () {

                    $rootScope.setSettings();

                    if ($rootScope.skynetConn) {

                        console.log('SKYNET LOADED');
                        _startListen();

                    }

                    $rootScope.isAuthenticated();

                    $rootScope.loading = false;

                }, $rootScope.redirectToError);
        };

        var _init = function(){
            $rootScope.skynetInit();

            _skynetLoad();
        }

        if($rootScope.isSettingUser()){
            Auth.getCurrentUser()
                .then(function(){
                    $location.path('/');
                    _init();
                });
        }else{
            _init();
        }


        $rootScope.setSettings();

        $rootScope.isAuthenticated();


        $rootScope.alertModal = function(title, msg){
            $rootScope.globalModal = {};
            $rootScope.globalModal.title = title;
            $rootScope.globalModal.msg = msg;

            $('#globalModal').addClass('active');
        };

        $rootScope.closeModal = function(){
            $rootScope.globalModal = {};
            $('#globalModal').removeClass('active');

        };

    });