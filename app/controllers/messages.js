var messagesApp = angular.module('messagesApp', ['hmTouchevents', 'SkynetModel']);

// Index: http://localhost/views/messages/index.html

messagesApp.controller('IndexCtrl', function ($scope, Skynet, OctobluRest) {

    // This will be populated with Restangula
    $scope.messagess = {};

    $scope.loading = true;

    $scope.devices = [];

    $scope.init = function () {
        Skynet.init(function (data) {
            $scope.loading = false;
            $scope.getSubdevices = function (device) {
                if (device.type == 'gateway') {
                    $scope.subdevices = device.subdevices;
                }
            };

            $scope.skynetuuid = window.localStorage.getItem("skynetuuid");
            $scope.skynettoken = window.localStorage.getItem("skynettoken");
            $scope.mobileuuid = window.localStorage.getItem("mobileuuid");
            $scope.mobiletoken = window.localStorage.getItem("mobiletoken");

            OctobluRest.getDevices($scope.skynetuuid, $scope.skynettoken, function(data) {
                var devices = data.devices;
                for (var i in devices) {
                    if(devices[i].type == 'gateway'){
                        $scope.devices.splice(i,1);
                    }
                }
                OctobluRest.getGateways($scope.skynetuuid, $scope.skynettoken, false, function(error, data) {
                    if(error) {
                        console.log('Error' + error);
                    }
                    console.log('Devices and Gateways', data.gateways);
                    devices = devices.concat(data.gateways);
                    for (var i in devices) {
                        console.log(devices[i].name);
                        if(!devices[i].name){
                            devices[i].name = '(Unkown)';
                        }
                    }
                    $scope.devices = devices;
                });

            });



            $scope.getSchema = function (device, subdevice) {
                console.log('device', device);
                console.log('subdevice', subdevice);
                $('#device-msg-editor').jsoneditor('destroy');

                for (var i in device.plugins) {
                    var plugin = device.plugins[i];
                    if (plugin.name === subdevice.type && plugin.messageSchema) {
                        $scope.schema = plugin.messageSchema;
                        $scope.schema.title = subdevice.name;
                    }
                }
                console.log($scope.schema);

                if ($scope.schema) {

                    $('#device-msg-editor').jsoneditor({
                        schema: $scope.schema,
                        theme: 'bootstrap3',
                        no_additional_properties: true,
                        iconlib: 'bootstrap3'
                    });

                }
            };


            Skynet.skynetSocket.on('message', function (channel, message) {
                alert('Message received from ' + channel + ': ' + message);
            });


            $scope.sendMessage = function () {
                /*
                     if schema exists - get the value from the editor, validate the input and send the message if valid
                     otherwise notify the user that there was an error.

                     if no schema exists, they are doing this manually and we check if the UUID field is populated and that
                     there is a message to send.
                     */

                var message, uuid;

                if ($scope.sendUuid === undefined || $scope.sendUuid === "") {
                    if ($scope.device) {
                        uuid = $scope.device.uuid;
                    } else {
                        uuid = "";
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
                            // if ($scope.sendText != ""){
                            //   message = $scope.sendText;
                            //   if(typeof message == "string"){
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
                            if (typeof message == "string") {
                                message = JSON.parse($scope.sendText);
                            }
                            // message = message.message;
                            $scope.subdevicename = message.subdevice;
                            delete message.subdevice;

                        } catch (e) {
                            message = $scope.sendText;
                            $scope.subdevicename = "";
                        }

                    }

                    alert(uuid);
                    Skynet.message({
                        "devices": uuid,
                        "subdevice": $scope.subdevicename,
                        "payload": message
                    }, function (data) {
                        console.log(data);
                    });
                    $scope.messageOutput = "Message Sent: " + JSON.stringify(message);

                }
            };
        });
    };

    // Get notified when an another webview modifies the data and reload
    window.addEventListener("message", function (event) {
        // reload data on message with reload status
        if (event.data.status === "reload") {}
    });
});

angular.bootstrap(document, ['messagesApp']);
