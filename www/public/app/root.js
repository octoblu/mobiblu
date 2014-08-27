'use strict';

angular.module('main')
    .run(function ($rootScope, $timeout, $location, $q, Auth, SkynetRest, Skynet) {

        var timeouts = [];

        $rootScope.loading = true;

        $rootScope.isDeveloper = false;

        $rootScope.matchRoute = function (route) {
            var regex = new RegExp('\\#\\!' + route);
            var path = window.location.href.split('?')[0];
            if (path.match(regex)) {
                return true;
            }
            return false;
        };

        $rootScope.clearAppTimeouts = function () {
            timeouts.forEach(function (timeout, i) {
                clearTimeout(timeout);
                timeouts.splice(i, 1);
            });
        };

        $rootScope.errorMsg = null;

        $rootScope.isErrorPage = function () {
            if ($rootScope.matchRoute('/error')) {
                return true;
            }
            return false;
        };

        var redirectToError = function (err, type) {
            if ($rootScope.isErrorPage()) return false;
            $rootScope.clearAppTimeouts();
            console.log('Error! ' + err);
            console.log('Redirecting to "' + type + '" Error');
            $timeout(function () {
                $rootScope.loading = false;
                $rootScope.errorMsg = err || '';
                $location.path('/error/' + type);
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
            //$rootScope.loading = false;
            $rootScope.clearAppTimeouts();
            timeouts.push(setTimeout(function () {
                console.log('Loading :: ' + $rootScope.loading);
                if ($rootScope.loading) {
                    $rootScope.redirectToError('Request Timeout.');
                }
            }, 1000 * 20));
        });

        $rootScope.setSettings = function () {
            $rootScope.settings = Skynet.getCurrentSettings();

            $rootScope.loggedin = $rootScope.settings.loggedin;

            $rootScope.skynetuuid = $rootScope.settings.skynetuuid;
            $rootScope.skynettoken = $rootScope.settings.skynettoken;

            $rootScope.mobileuuid = $rootScope.settings.mobileuuid;
            $rootScope.mobiletoken = $rootScope.settings.mobiletoken;

            $rootScope.isDeveloper = $rootScope.settings.settings ? $rootScope.settings.settings.developer_mode : false;

            console.log('in $rootScope.setSettings() ++ ' + $rootScope.settings.skynetuuid);

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

        $rootScope.setSettings();

        Skynet.start();

        // Modals

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

            if (!obj.skipSearch) {
                return $rootScope.searchForDevices('myDevices');
            }

            function onError(action, err, info) {
                if (!info) info = '';
                info = '<br>' + info;
                console.log('ERROR ' + action + ' device: ' + JSON.stringify(err));
                $rootScope.$apply(function () {
                    $rootScope.closeDevicesModal();
                    $rootScope.redirectToCustomError('Unable to ' + action + ' that device. ' + info);
                });
            }

            function onSuccess(action, result, info) {
                console.log(action + ' device result' + JSON.stringify(result));
                var error = result.err || result.error;
                if (error) {
                    onError(action, error, info);
                } else {
                    $rootScope.$apply(function () {
                        $rootScope.closeDevicesModal();
                        if (action === 'delete') {
                            action += 'd';
                        } else {
                            action += 'ed';
                        }
                        $rootScope.alertModal('Device ' + action, 'Device successfully ' + action + '!');
                    });
                }
            }

            obj = _.extend({
                title: 'Devices',
                devices: [],
                editDevice: function (device) {
                    var action = 'edit', info = 'You may not have permission to edit that device.';

                    SkynetRest.editDevice(device)
                        .then(function (result) {
                            onSuccess(action, result, info);
                        }, function (err) {
                            onError(action, err, info);
                        });
                },
                claimDevice: function (device) {
                    var action = 'claim', info = 'You may not have permission to claim that device.';

                    $rootScope.ready(function () {
                        Skynet.claimDevice(device.uuid)
                            .timeout(5 * 1000)
                            .then(function (result) {
                                onSuccess(action, result, info);
                            }, function (err) {
                                onError(action, err, info);
                            });
                    });
                },
                deleteDevice: function (device) {
                    var action = 'delete', info = 'You may not have permission to delete that device.';

                    SkynetRest.deleteDevice(device)
                        .then(function (result) {
                            onSuccess(action, result, info);
                        }, function (err) {
                            onError(action, err, info);
                        });
                },
                canDelete: function () {
                    var device = $rootScope.devicesModal.device || {},
                        owner = $rootScope.settings.skynetuuid,
                        mobileUuid = $rootScope.settings.mobileuuid;

                    var validOwners = [owner, mobileUuid];
                    if (~validOwners.indexOf(device.uuid)) {
                        return false;
                    }
                    if (!~validOwners.indexOf(device.owner)) {
                        return false;
                    }
                    return true;
                },
                canSave: function () {
                    var device = $rootScope.devicesModal.device || {},
                        owner = $rootScope.settings.skynetuuid,
                        mobileUuid = $rootScope.settings.mobileuuid;

                    var validOwners = [owner, mobileUuid];
                    if (!~validOwners.indexOf(device.owner)) {
                        return false;
                    }
                    return true;
                }
            }, obj);

            obj.editMode = false;
            obj.device = null;

            obj.showEdit = function (device) {
                $rootScope.devicesModal.editMode = true;
                $rootScope.devicesModal.device = device;
            };

            $rootScope.devicesModal = obj;

            $('#devicesModal').addClass('active');

            $timeout(function () {
                $rootScope.loading = false;
            }, 100);

        };

        $rootScope.searchForDevices = function (method) {
            $rootScope.loading = true;

            if ($rootScope.devicesModal) {
                $rootScope.devicesModal.editMode = false;
                $rootScope.devicesModal.devices = [];
            }
            $rootScope.devicesMethod = method;
            Skynet.ready(function () {
                if (typeof Skynet[method] !== 'function') {
                    console.log('Not Valid Function: ' + method);
                    return false;
                }

                Skynet[method]().then(function (result) {
                    console.log('Devices result', result);
                    var devices = result ? result.devices : [];
                    $rootScope.showDevicesModal({
                        devices: devices,
                        skipSearch: true
                    });
                });
            });
        };

        $rootScope.closeDevicesModal = function () {
            $rootScope.devicesMethod = null;

            $rootScope.devicesModal = {};
            $('#devicesModal').removeClass('active');
        };
    });