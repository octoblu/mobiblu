'use strict';

var messagesApp = angular.module('main.messages', ['hmTouchevents', 'SkynetModel']);

// Index: http://localhost/views/messages/index.html

messagesApp.controller('MessageCtrl', function ($scope, Skynet, OctobluRest) {

    $(document).trigger('togglebackbtn', false);
    // This will be populated with Restangula
    $scope.messagess = {};

    $scope.loading = true;

    $scope.devices = [{
        name : 'Select Device',
        type : 'dummy'
    }];
    $scope.device = $scope.devices[0];

    $scope.init = function () {

        $scope.skynetuuid = Skynet.skynetuuid;
        $scope.skynettoken = Skynet.skynettoken;

        $scope.mobileuuid = Skynet.mobileuuid;
        $scope.mobiletoken = Skynet.mobiletoken;

        Skynet.init(function () {
            $scope.loading = false;

            $scope.skynetuuid = Skynet.skynetuuid;
            $scope.skynettoken = Skynet.skynettoken;

            $scope.mobileuuid = Skynet.mobileuuid;
            $scope.mobiletoken = Skynet.mobiletoken;

            Skynet.skynetSocket.on('message', function (channel, message) {
                alert('Message received from ' + channel + ': ' + message);
            });

        });

        $scope.getDevices();
    };

    $scope.subdevices = [];

    $scope.getSubdevices = function (device) {
        if (device.type !== 'dummy' && device.type === 'gateway') {
            $scope.subdevices = device.subdevices;
            $scope.subdevice = $scope.subdevices ? $scope.subdevices[0] : null;
        }
    };

    $scope.getDevices = function(){
        OctobluRest.getGateways($scope.skynetuuid, $scope.skynettoken, true, function(error, data) {
            if(error) {
                console.log('Error' + error);
            }
            if(data && data.gateways){
                data.gateways.forEach(function(gateway){
                    $scope.devices.push(gateway);
                });
            }
            for (var i in $scope.devices) {
                if(!$scope.devices[i].name){
                    $scope.devices[i].name = '(Unkown)';
                }
            }
        });
    };

    $scope.getSchema = function (device, subdevice) {

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
                theme: 'html',
                no_additional_properties: true,
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
                    // if ($scope.sendText != ''){
                    //   message = $scope.sendText;
                    //   if(typeof message == 'string'){
                    //     message = JSON.parse($scope.sendText);
                    //   }
                    // } else {
                    message = $('#device-msg-editor').jsoneditor('value');
                    console.log('schema message', message);
                    // }

                    $scope.subdevicename = $scope.subdevice.name;
                }

            } else {
                message = $scope.sendText;
                try {
                    if (typeof message == 'string') {
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
            Skynet.message({
                'devices': uuid,
                'subdevice': $scope.subdevicename,
                'payload': message
            }, function (data) {
                console.log(data);
            });
            $scope.messageOutput = 'Message Sent: ' + JSON.stringify(message);
        }
    };

    // Get notified when an another webview modifies the data and reload
    window.addEventListener('message', function (event) {
        // reload data on message with reload status
        if (event.data.status === 'reload') {}
    });
});