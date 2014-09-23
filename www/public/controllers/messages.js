'use strict';

angular.module('main.messages')
    .controller('MessageCtrl',
    function ($rootScope, $scope, OctobluRest, Device, GatebluPlugins, $q, Skynet) {

        // This will be populated with Restangula
        $scope.messages = {};

        $scope.devices = [
            {
                name: 'Select Device',
                type: 'dummy'
            }
        ];
        $scope.device = $scope.devices[0] || null;

        $scope.init = function () {
            Device.getDevices().then(function(devices){
                $scope.devices = $scope.devices.concat(_.sortBy(_.cloneDeep(devices),'name'));
                console.log('Devices, ', devices);
            });
        };

        $scope.subdevices = [];

        $scope.$watch('device', function(newDevice){
            $scope.subdevice = null;
            if (newDevice && newDevice.type !== 'dummy') {
                if (newDevice.type !== 'gateway') {
                    $scope.schema = {};
                } else {
                    Device.gatewayConfig({
                        uuid: newDevice.uuid,
                        token: newDevice.token,
                        method: "configurationDetails"
                    }).then(function (response) {
                        if (response && response.result) {
                            $scope.subdevices = response.result.subdevices || [];
                            $scope.plugins = response.result.plugins || [];
                        }
                    });
                }
            } else {
                delete $scope.schema;
            }
        });

        $scope.$watch('subdevice', function (newSubdevice) {

            if(!$scope.schemaEditor) $scope.schemaEditor = {};

            if (newSubdevice) {
                var plugin = _.findWhere($scope.plugins, {name: newSubdevice.type});
                if (!plugin) {
                    GatebluPlugins.installPlugin($scope.device, newSubdevice.type)
                        .then(function () {
                            return GatebluPlugins.getInstalledPlugins($scope.device);
                        })
                        .then(function (result) {
                            $scope.plugins = result;
                            $scope.plugin = _.findWhere($scope.recipientDevice.plugins, {name: newSubdevice.type});
                            $scope.schema = $scope.plugin.messageSchema;
                        });
                } else {
                    $scope.plugin = plugin;
                    $scope.schema = $scope.plugin.messageSchema;
                }
            }

        });

        $scope.sendMessage = function () {

            var message, uuid;

            if (_.isEmpty($scope.sendUuid)) {
                if ($scope.device) {
                    uuid = $scope.device.uuid;
                } else {
                    uuid = '';
                }
            } else {
                uuid = $scope.sendUuid;
            }

            if (uuid) {

                if ($scope.schema) {
                    var errors = $scope.schemaEditor.validate();

                    if (errors.length) {
                        $rootScope.alertModal('Error', JSON.stringify(errors));

                    } else {
                        message = $scope.schemaEditor.getValue();

                        $scope.subdeviceuuid = $scope.subdevice.uuid;

                        $scope.subdevicename = $scope.subdevice.name;
                    }

                } else {
                    message = $scope.sendText;
                    try {
                        if (typeof message === 'string') {
                            message = JSON.parse($scope.sendText);
                        }
                        // message = message.message;
                        $scope.subdevicename = message.subdevice;
                        delete message.subdevice;

                    } catch (e) {
                        message = $scope.sendText;
                        $scope.subdevicename = '';
                    }

                }

                console.log('UUID and subdevice name ', uuid, $scope.subdevicename);
                var html = '<strong>To UUID:</strong> ' + uuid;

                if($scope.subdevicename){
                    html += '<br><br>' +
                        '<strong>To Subdevice:</strong>' +
                        '<br>' + $scope.subdevicename;
                }

                html += '<br><br>' +
                    '<strong>Sent Data:</strong>' +
                    '<br>' + JSON.stringify(message);

                $rootScope.alertModal('Message Sent', html);

                Skynet.message({
                    'devices': uuid,
                    'subdevice': $scope.subdeviceuuid || $scope.subdevicename,
                    'payload': message
                }).then(function (data) {


                    $rootScope.globalModal.msg += '<br><br>' +
                        '<strong>Received Data:</strong>' +
                        '<br>' + JSON.stringify(data);


                }, $rootScope.redirectToError);
            }
        };
    });
