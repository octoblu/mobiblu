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


            OctobluRest.getGateways($scope.skynetuuid, $scope.skynettoken, true, function(error, data) {
                if(error) {
                    console.log('Error' + error);
                }
                if(data && data.gateways){
                    $scope.devices = data.gateways;
                }else{
                    $scope.devices = [];
                }
                for (var i in $scope.devices) {
                    if(!$scope.devices[i].name){
                        $scope.devices[i].name = '(Unkown)';
                    }
                }
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
                        theme: 'html',
                        no_additional_properties: true,
                        iconlib: 'fontawesome4'
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
