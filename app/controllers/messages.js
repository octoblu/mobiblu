'use strict';

var messagesApp = angular.module('main.messages', ['hmTouchevents', 'SkynetModel']);

// Index: http://localhost/views/messages/index.html

messagesApp.controller('MessageCtrl', function ($rootScope, $scope, OctobluRest, $q) {

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
        //var gateways = _.filter(myDevices, {type: 'gateway', online: true });
        var gateways = myDevices;
        _.map(gateways, function (gateway) {
            gateway.subdevices = [];
            gateway.plugins = [];

            return $scope.gatewayConfig({
                'uuid': gateway.uuid,
                'token': gateway.token,
                'method': 'configurationDetails'
            }).then(function (response) {
                if (response && response.result) {
                    gateway.subdevices = response.result.subdevices || [];
                    gateway.plugins = response.result.plugins || [];
                }
            }, function () {
                console.log('couldn\'t get data for: ');
                console.log(gateway);
            });
        });
        return gateways;
    };

    $scope.getDevices = function () {
        var promise = OctobluRest.getDevices($scope.skynetuuid, $scope.skynettoken);

        promise.then(function (res) {
            var myDevices = res.data;
            console.log('Retrieved devices');
            $scope.devices = $scope.getGateways(myDevices);

            $rootScope.loading = false;
        }, $rootScope.redirectToError);
    };

    $scope.getSchema = function (device, subdevice) {
        if (!device) device = $scope.device;
        if (!subdevice) subdevice = $scope.subdevice;

        for (var i in device.plugins) {
            var plugin = device.plugins[i];
            if (plugin.name === subdevice.type && plugin.messageSchema) {
                $scope.schema = plugin.messageSchema;
                $scope.schema.title = subdevice.name;
            }
        }

        $scope.schemaEditor = {};
    };

    $scope.sendMessage = function () {
        /*
         if schema exists - get the value from the editor, validate the input and send the message if valid
         otherwise notify the user that there was an error.

         if no schema exists, they are doing this manually and we check if the UUID field is populated and that
         there is a message to send.
         */

        var message, uuid;

        if ($scope.sendUuid === undefined || $scope.sendUuid === '') {
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
                var errors = $('#device-msg-editor').jsoneditor('validate');
                if (errors.length) {
                    alert(errors);
                } else {
                    message = $scope.schemaEdi;
                    console.log('schema message', JSON.stringify(message));

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

            console.log('UUID and subdevicename ', uuid, $scope.subdevicename);
            $rootScope.Skynet.message({
                'devices': uuid,
                'subdevice': $scope.subdevicename,
                'payload': message
            }).then(function (data) {
                console.log(data);
            }, $rootScope.redirectToError);
            $scope.messageOutput = 'Message Sent: ' + JSON.stringify(message);
        }

        $('body').css('height', '100%');
    };
});
