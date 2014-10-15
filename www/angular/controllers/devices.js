'use strict';

angular.module('main.system').controller('DeviceCtrl',
    function ($rootScope, $scope, Skynet, SkynetRest, Device) {

        var devicesHash = {};

        $scope.showDevicesModal = function (obj) {

            if (!obj.skipSearch) {
                return $scope.searchForDevices('getDevices');
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
                    $scope.devicesModal.editMode = false;
                }
            }

            obj = _.extend({
                title: 'Devices',
                devices: [],
                editDevice: function (device) {
                    var action = 'edit', info = 'You may not have permission to edit that device.';

                    Device.updateDevice(device)
                        .then(function (result) {
                            onSuccess(action, result, info);
                        }, function (err) {
                            onError(action, err, info);
                        });
                },
                claimDevice: function (device) {
                    var action = 'claim', info = 'You may not have permission to claim that device.';
                    console.log('Claim device', device);
                    Device.claimDevice(device)
                        .then(function (result) {

                            var newDevices = devicesHash[$scope.devicesMethod];
                            newDevices = _.filter(newDevices, function(_device){
                                return _device.uuid !== device.uuid;
                            });
                            $scope.devicesModal.devices = devicesHash[$scope.devicesMethod] = newDevices;

                            onSuccess(action, result, info);
                        }, function (err) {
                            onError(action, err, info);
                        });
                },
                deleteDevice: function (device) {
                    var action = 'delete', info = 'You may not have permission to delete that device.';

                    SkynetRest.deleteDevice(device)
                        .then(function (result) {
                            var newDevices = devicesHash[$scope.devicesMethod];
                            newDevices = _.filter(newDevices, function(_device){
                                return _device.uuid !== device.uuid;
                            });
                            $scope.devicesModal.devices = devicesHash[$scope.devicesMethod] = newDevices;
                            onSuccess(action, result, info);
                        }, function (err) {
                            onError(action, err, info);
                        });
                },
                canEdit: function () {
                    var device = $scope.devicesModal.device || {};
                    if(device.owner === $rootScope.skynetuuid){
                        return true;
                    }
                    if(device.owner === $rootScope.mobileuuid){
                        return true;
                    }
                    return false;
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

            setTimeout(function(){
                $('#devicesModal .bar').css('position', 'absolute');
            }, 200);

        };

        $scope.searchForDevices = function (method) {
            $rootScope.loading = true;

            if ($scope.devicesModal) {
                $scope.devicesModal.editMode = false;
                $scope.devicesModal.devices = [];
            }
            $scope.devicesMethod = method;
            Skynet.ready(function () {
                if (!_.isFunction(Device[method])) {
                    console.log('Not Valid Function: ' + method);
                    return false;
                }

                console.log('Method', method);

                if(devicesHash[method]){
                    $rootScope.loading = false;
                    $scope.showDevicesModal({
                        devices: devicesHash[method],
                        skipSearch: true
                    });
                }

                Device[method]().then(function (devices) {
                    devicesHash[method] = _.filter(devices, function(device){
                        if(device.uuid === $rootScope.mobileuuid){
                            return false;
                        }
                        if(device.uuid === $rootScope.skynetuuid){
                            return false;
                        }
                        return true;
                    });
                    $rootScope.loading = false;
                    $scope.showDevicesModal({
                        devices: devicesHash[method],
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