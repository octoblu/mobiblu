'use strict';

var sensorsApp = angular.module('main.sensors', ['HomeModel', 'hmTouchevents', 'SkynetModel', 'SensorModel']);

sensorsApp.controller('SensorCtrl', function ($scope, $filter, $routeParams, HomeRestangular, Skynet, Sensors) {

    $scope.sensorTypes = [
        {
            type : 'accelerometer',
            label : 'Accelerometer',
            icon : 'fa fa-rss'
        },
        {
            type : 'compass',
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

    if($scope.sensor){
        $(document).trigger('togglebackbtn', true);
    }else{
        $(document).trigger('togglebackbtn', false);
    }

    $scope.init = function(){
        Skynet.init(function () {
            $scope.settings = Skynet.settings;
            $scope.setting = Skynet.settings[$scope.sensor.type];
        });
    };

    $scope.update = function(){
        var data = {
            name: Skynet.devicename,
            setting: $scope.settings
        };
        Skynet.updateDeviceSetting(data, function () {
        });
    };

    $scope.sendTracking = function () {
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
        var setting = $scope.sensor.type;
        $scope.settings[setting] = !$scope.settings[setting];
        $scope.update();
    };

});

sensorsApp.controller('ErrorsCtrl', function ($scope, Skynet, Sensors) {

    $scope.errors = [];

    $(document).trigger('togglebackbtn', true);

    Skynet.init(function () {});
});