'use strict';

angular.module('main')
    .run(function ($rootScope, $location, $q, Auth, SkynetRest) {

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
            console.log('Error! ' + err);
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
            $rootScope.loading = false;
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

            $rootScope.skynetuuid = $rootScope.settings.skynetuuid;
            $rootScope.skynettoken = $rootScope.settings.skynettoken;

            $rootScope.mobileuuid = $rootScope.settings.mobileuuid;
            $rootScope.mobiletoken = $rootScope.settings.mobiletoken;

            $rootScope.isDeveloper = $rootScope.settings.settings ? $rootScope.settings.settings.developer_mode : false;

            $rootScope.skynetConn = $rootScope.settings.conn;

            $rootScope.Sensors = $rootScope.Skynet.Sensors;
            console.log('in $rootScope.setSettings() ++ ' + $rootScope.settings.skynetuuid);

        };

        $rootScope.isSettingUser = function () {
            var uuid = getParam('uuid'), token = getParam('token');

            if (uuid && token) {
                return true;
            } else {
                return false;
            }
        };

        $rootScope.footerDisabled = false;

        $rootScope.isAuthenticated = function () {
            if (!$rootScope.loggedin) {
                if (!$rootScope.matchRoute('/login')) {
                    console.log('Redirecting to login');
                    $location.path('/login');
                }
                return false;
            } else {
                if ($rootScope.matchRoute('/login')) {
                    console.log('Redirecting to homepage');
                    $location.path('/');
                }
                return true;
            }
        };

        var pluginsLoaded = false;

        var pluginReady = function () {
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

        $rootScope.pluginReady = function (cb) {
            pluginReady().then(function () {
                cb();
            }, function(err){
                $rootScope.redirectToError(err || 'Plugins module didn\'t load');
            });
        };

        var _skynetInit = function () {
            var deferred = $q.defer();
            if (isErrorPage()) {
                deferred.resolve();
            } else {
                Auth.getCurrentUser()
                    .then(function (currentUser) {
                        var uuid, token;
                        if (currentUser && currentUser.skynet) {
                            uuid = currentUser.skynet.uuid;
                            token = currentUser.skynet.token;
                        }

                        $rootScope.Skynet.init(uuid, token)
                            .timeout(1000 * 15)
                            .then(function () {
                                console.log('_skynetInit successful');
                                clearAppTimeouts();
                                deferred.resolve();
                            }, function(){
                                console.log('Unable to connect to Meshblu');
                                $rootScope.redirectToError('Unable to connect to Meshblu');
                            });
                    }, deferred.reject);

            }
            return deferred.promise;
        };

        var _skynetLoad = function () {

            var deferred = $q.defer();

            $(document).on('skynet-ready', function () {
                loaded = true;
                deferred.resolve();
            });

            return deferred.promise;
        };

        $rootScope.ready = function (cb) {
            $rootScope.setSettings();

            if (loaded || isErrorPage() || $rootScope.matchRoute('/login')){
                cb();
            } else {
                _skynetLoad().then(cb, function(err){
                    $rootScope.redirectToError(err || 'Meshblu can\'t connect');
                });
            }
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
            return _skynetInit()
                .then(function () {
                    var deferred = $q.defer();

                    $rootScope.setSettings();

                    if ($rootScope.skynetConn) {

                        console.log('SKYNET LOADED');
                        $(document).trigger('skynet-ready');
                        loaded = true;

                        _startListen();

                    }


                    $rootScope.isAuthenticated();

                    $rootScope.loading = false;

                    deferred.resolve();

                    return deferred.promise;

                }, function(){
                    $location.path('/login');
                });
        };

        var _init = function () {

            $rootScope.skynetInit();

            _skynetLoad();

        };

        $rootScope.setSettings();

        _init();

        $rootScope.alertModal = function (title, msg) {
            $rootScope.globalModal = {};
            $rootScope.globalModal.title = title;
            $rootScope.globalModal.msg = msg;

            $('#globalModal').addClass('active');
        };

        $rootScope.closeModal = function () {
            $rootScope.globalModal = {};
            $('#globalModal').removeClass('active');
        };


        $rootScope.showDevicesModal = function (obj) {

            function onError(action, err, info) {
                if(!info) info = '';
                info = '<br>' + info;
                console.log('ERROR ' + action + ' device: ' + JSON.stringify(err));
                $rootScope.$apply(function () {
                    $rootScope.closeDevicesModal();
                    $rootScope.redirectToCustomError('Unable to ' + action + ' that device. ' + info);
                });
            }

            function onSuccess(action, result){
                console.log(action + ' device result' + JSON.stringify(result));
                if (result.err) {
                    onError(action, result.err, info);
                } else {
                    $rootScope.$apply(function () {
                        $rootScope.closeDevicesModal();
                        if(action === 'delete') {
                            action += 'd';
                        }else{
                            action += 'ed';
                        }
                        $rootScope.alertModal('Device ' + action, 'Device successfully ' + action + '!');
                    });
                }
            }

            obj = _.extend({
                title : 'Devices',
                devices : [],
                editDevice: function (device) {
                    var action = 'edit', info = 'You may not have permission to edit that device.';
                    SkynetRest.editDevice(device, $rootScope.settings)
                        .then(function (result) {
                            onSuccess(action, result);
                        }, function(err){
                            onError(action, err, info);
                        });
                },
                claimDevice: function (device) {
                    var action = 'claim', info = 'You may not have permission to claim that device.';
                    SkynetRest.claimDevice(device.uuid, $rootScope.settings)
                        .then(function (result) {
                            onSuccess(action, result);
                        }, function(err){
                            onError(action, err, info);
                        });
                },
                deleteDevice: function (device) {
                    var action = 'delete', info = 'You may not have permission to delete that device.';

                    SkynetRest.deleteDevice(device, $rootScope.settings)
                        .then(function (result) {
                            onSuccess(action, result);
                        }, function(err){
                            onError(action, err, info);
                        });
                }
            }, obj);

            obj.editMode = false;
            obj.device = null;

            obj.showEdit = function(device){
                $rootScope.devicesModal.editMode = true;
                $rootScope.devicesModal.device = device;
            };

            $rootScope.devicesModal = obj;

            $('#devicesModal').addClass('active');
        };

        $rootScope.searchForDevices = function (method) {
            $rootScope.loading = true;
            if(typeof SkynetRest[method] !== 'function'){
                return false;
            }
            if($rootScope.devicesModal){
                $rootScope.devicesModal.editMode = false;
                $rootScope.devicesModal.devices = [];
            }
            $rootScope.devicesMethod = method;
            SkynetRest[method]($rootScope.settings)
                .then(function (result) {
                    console.log('Devices result', result);
                    $rootScope.$apply(function () {
                        $rootScope.loading = false;
                    });

                    $rootScope.ready(function () {
                        var devices = result ? result.devices : [];
                        $rootScope.showDevicesModal({
                            devices: devices
                        });
                    });
                }, function (err) {
                    console.log('ERROR getting devices', err);
                });
        };


        $rootScope.closeDevicesModal = function () {
            $rootScope.devicesMethod = null;

            $rootScope.devicesModal = {};
            $('#devicesModal').removeClass('active');
        };
    });