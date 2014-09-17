'use strict';

angular.module('main.system').controller('DeviceCtrl',
    function ($rootScope, $scope, Skynet, SkynetRest, $timeout) {

        $scope.showDevicesModal = function (obj) {

            if (!obj.skipSearch) {
                return $scope.searchForDevices('myDevices');
            }

            function onError(action, err, info) {
                if (!info) info = '';
                info = '<br>' + info;
                console.log('ERROR ' + action + ' device: ' + JSON.stringify(err));
                $scope.closeDevicesModal();
                $rootScope.redirectToCustomError('Unable to ' + action + ' that device. ' + info);
            }

            function onSuccess(action, result, info) {
                console.log(action + ' device result: ' + JSON.stringify(result));
                var error = result ? result.err || result.error : null;
                if (error) {
                    onError(action, error, info);
                } else {
                    $scope.closeDevicesModal();
                    if (action === 'delete') {
                        action += 'd';
                    } else {
                        action += 'ed';
                    }
                    $rootScope.alertModal('Device ' + action, 'Device successfully ' + action + '!');
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

                    Skynet.ready(function () {
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
                    var device = $scope.devicesModal.device || {},
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
                    var device = $scope.devicesModal.device || {},
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
                $scope.devicesModal.editMode = true;
                $scope.devicesModal.device = device;
            };

            $scope.devicesModal = obj;

            $('#devicesModal').addClass('active');

            $timeout(function () {
                $rootScope.loading = false;
            }, 100);

        };

        $scope.searchForDevices = function (method) {
            $rootScope.loading = true;

            if ($scope.devicesModal) {
                $scope.devicesModal.editMode = false;
                $scope.devicesModal.devices = [];
            }
            $scope.devicesMethod = method;
            Skynet.ready(function () {
                if (typeof Skynet[method] !== 'function') {
                    console.log('Not Valid Function: ' + method);
                    return false;
                }

                Skynet[method]().then(function (result) {
                    console.log('Devices result', result);
                    var devices = result ? result.devices : [];
                    $scope.showDevicesModal({
                        devices: devices,
                        skipSearch: true
                    });
                });
            });
        };

        $scope.closeDevicesModal = function () {
            $scope.devicesMethod = null;

            $scope.devicesModal = {};
            $('#devicesModal').removeClass('active');
        };

        $rootScope.$on('show-devices-modal', function(){
            console.log('On Show Devices Modal');
            $scope.showDevicesModal({});
        });
    });