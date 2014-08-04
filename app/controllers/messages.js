'use strict';

angular.module('main.messages')
    .controller('MessageCtrl',
    function ($rootScope, $scope, OctobluRest, $q) {

        $rootScope.$emit('togglebackbtn', false);
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
            $rootScope.ready(function () {
                $rootScope.loading = true;
                $scope.skynetuuid = $rootScope.settings.skynetuuid;
                $scope.skynettoken = $rootScope.settings.skynettoken;

                $scope.mobileuuid = $rootScope.settings.mobileuuid;
                $scope.mobiletoken = $rootScope.settings.mobiletoken;
                $scope.getDevices();
            });
        };

        $scope.subdevices = [];

        $scope.getSubdevices = function (device) {
            $scope.device = device;
            if (device.subdevices) {

                console.log('Device :: ' + JSON.stringify(device));
                $scope.subdevices = device.subdevices;
                $scope.subdevice = $scope.subdevices ? $scope.subdevices[0] : null;

                $scope.getSchema();

            }
        };

        $scope.gatewayConfig = function (options) {
            var defer = $q.defer(), promise = defer.promise;

            $rootScope.settings.conn
                .gatewayConfig(options, function (result) {
                    defer.resolve(result);
                });

            return promise;
        };

        $scope.getGateways = function (myDevices) {
            $scope.devices = myDevices;
            var gateways = _.filter(myDevices, { type: 'gateway' });
            _.map(gateways, function (gateway) {
                gateway.subdevices = [];
                gateway.plugins = [];

                return $scope.gatewayConfig({
                    'uuid': gateway.uuid,
                    'token': gateway.token,
                    'method': 'configurationDetails'
                }).then(function (response) {
                    if (response && response.result) {
                        var index = _.findIndex($scope.devices, { uuid : gateway.uuid });
                        $scope.devices[index].subdevices = response.result.subdevices || [];
                        $scope.devices[index].plugins = response.result.plugins || [];
                    }
                }, function () {
                    console.log('couldn\'t get data for: ');
                    console.log(gateway);
                });
            });
        };

        $scope.getDevices = function () {
            var promise = OctobluRest.getDevices($scope.skynetuuid, $scope.skynettoken);

            promise.then(function (res) {
                var myDevices = res ? res.data : [];
                console.log('Retrieved devices');
                $scope.getGateways(myDevices);

                $rootScope.loading = false;
            }, $rootScope.redirectToError);
        };

        $scope.getSchema = function (device, subdevice) {
            if (!device) device = $scope.device;
            if (!subdevice) subdevice = $scope.subdevice;

            if(!$scope.schemaEditor) $scope.schemaEditor = {};

            for (var i in device.plugins) {
                var plugin = device.plugins[i];
                if (plugin.name === subdevice.type && plugin.messageSchema) {
                    $scope.schema = plugin.messageSchema;
                    $scope.schema.title = subdevice.name;
                }
            }

        };

        $scope.sendMessage = function () {
            /*
             if schema exists - get the value from the editor, validate the input and send the message if valid
             otherwise notify the user that there was an error.

             if no schema exists, they are doing this manually and we check if the UUID field is populated and that
             there is a message to send.
             */

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

                        $scope.subdevicename = $scope.subdevice.uuid;
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

                $rootScope.Skynet.message({
                    'devices': uuid,
                    'subdevice': $scope.subdevicename,
                    'payload': message
                }).then(function (data) {

                    $scope.$apply(function(){

                        $rootScope.globalModal.msg += '<br><br>' +
                            '<strong>Received Data:</strong>' +
                            '<br>' + JSON.stringify(data);

                    });


                }, $rootScope.redirectToError);
            }
        };
    });
