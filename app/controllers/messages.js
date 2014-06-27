'use strict';

var messagesApp = angular.module('main.messages', ['hmTouchevents', 'SkynetModel']);

// Index: http://localhost/views/messages/index.html

messagesApp.controller('MessageCtrl', function ($rootScope, $scope, OctobluRest) {

    $rootScope.$emit('togglebackbtn', false);
    // This will be populated with Restangula
    $scope.messages = {};

    $scope.devices = [{
        name : 'Select Device',
        type : 'dummy'
    }];
    $scope.device = $scope.devices[0] || null;

    $scope.init = function () {
        $rootScope.ready(function(){
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
        if (device.type !== 'dummy' && device.type === 'gateway') {
            $scope.device = device;
            $scope.subdevices = device.subdevices;
            $scope.subdevice = $scope.subdevices ? $scope.subdevices[0] : null;

            $scope.getSchema();
        }
    };

    $scope.getDevices = function(){
        var promise = OctobluRest.getGateways($scope.skynetuuid, $scope.skynettoken, true);

        promise.then(function(res){
            var data = res.data;
            console.log('Retrieved devices');
            if(data && data.gateways){
                $scope.devices =  $scope.devices.concat(data.gateways);
            }
            for (var i in $scope.devices) {
                if(!$scope.devices[i].name){
                    $scope.devices[i].name = '(Unkown)';
                }
            }
            $rootScope.loading = false;
        }, $rootScope.redirectToError);
    };

    $scope.getSchema = function (device, subdevice) {
        if(!device) device = $scope.device;
        if(!subdevice) subdevice = $scope.subdevice;
        $('#device-msg-editor').jsoneditor('destroy');

        for (var i in device.plugins) {
            var plugin = device.plugins[i];
            if (plugin.name === subdevice.type && plugin.messageSchema) {
                $scope.schema = plugin.messageSchema;
                $scope.schema.title = subdevice.name;
            }
        }

        if ($scope.schema) {

            $('#device-msg-editor').jsoneditor({
                schema: $scope.schema,
                theme: 'bootstrap3',
                no_additional_properties: true,
                disable_collapse : true,
                iconlib: 'fontawesome4'
            });

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
                    message = $('#device-msg-editor').jsoneditor('value');
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
