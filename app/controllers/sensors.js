'use strict';

var homeApp = angular.module('main.sensors', ['HomeModel', 'hmTouchevents', 'SkynetModel', 'SensorModel']);

homeApp.controller('SensorCtrl', function ($scope, $filter, $routeParams, HomeRestangular, Skynet, Sensors) {

    $scope.sensorTypes = [
        {
            type : 'accelerometer',
            label : 'Accelerometer',
            icon : 'fa fa-rss'
        },
        {
            type : 'codeompass',
            label : 'Compass',
            icon : 'fa fa-compass'
        },
        {
            type : 'geolocation',
            label : 'Geolocation',
            icon : 'fa fa-crosshairs'
        }
    ];

    $scope.sensor = null;

    if($routeParams.sensorType){
        for(var x in $scope.sensorTypes){
            if($scope.sensorTypes[x].type === $routeParams.sensorType){
                $scope.sensor = $scope.sensorTypes[x];
            }
        }
    }

    $scope.init = function(){
        Skynet.init(function () {
            Skynet.getDeviceSetting(Skynet.mobileuuid, function (data) {
                $scope.$apply(function () {
                    if (data.setting) {
                        $scope.settings = Skynet.settings = data.setting;
                    }else{
                        $scope.settings = Skynet.settings;
                    }
                });
            });
        });
    };

    $scope.update = function(){
        var data = {
            name: Skynet.devicename,
            setting: $scope.settings
        };
        var type = $scope.sensor.type;
        Skynet.settings[type] = true;
        Skynet.updateDeviceSetting(data, function () {
        });
    };

    $scope.sendTracking = function () {
        console.log($scope.sensor.label);
        if ($scope.sensor && typeof Sensors[$scope.sensor.label] === 'function') {
            var sensorObj = Sensors[$scope.sensor.label](3000);
            sensorObj.start(function (sensorData) {
                var el = document.getElementById('sensorData');
                if (el) {
                    var html = sensorObj.prettify(sensorData);
                    el.innerHTML = sensorObj.stream ? html + el.innerHTML : html;

                    Skynet.skynetSocket.emit('data', {
                        'uuid': Skynet.mobileuuid,
                        'token': Skynet.mobiletoken,
                        'sensorData': {
                            'type': $scope.sensor.label,
                            'data': sensorData
                        }
                    }, function () {
                        el.innerHTML = html + '<strong>Skynet Updated</strong><hr>';
                    });
                }
            },
            function (err) {
                alert('Error: ' + err.code);
            });
        }
    };

    $scope.toggleSwitch = function () {
        console.log('Toggle Switch', $scope.sensor.type);
        var setting = $scope.sensor.type;
        $scope.settings[setting] = !$scope.settings[setting];
        $scope.update();
    };

});
