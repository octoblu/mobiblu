'use strict';

angular.module('main.sensors')
    .controller('SensorCtrl',
    function ($rootScope, $scope, $filter, $routeParams) {

        $rootScope.loading = true;

        $scope.sensorTypes = [
            {
                type: 'accelerometer',
                label: 'Accelerometer',
                icon: 'fa fa-rss'
            },
            {
                type: 'compass',
                label: 'Compass',
                icon: 'fa fa-compass'
            },
            {
                type: 'geolocation',
                label: 'Geolocation',
                icon: 'fa fa-crosshairs'
            }
        ];

        $scope.sensor = null;

        if ($routeParams.sensorType) {
            for (var x in $scope.sensorTypes) {
                if ($scope.sensorTypes[x].type === $routeParams.sensorType) {
                    $scope.sensor = $scope.sensorTypes[x];
                }
            }
        }

        if ($scope.sensor) {
            $rootScope.$emit('togglebackbtn', true);
        } else {
            $rootScope.$emit('togglebackbtn', false);
        }

        $scope.init = function () {
            $rootScope.ready(function () {
                var settings = $rootScope.settings;
                $rootScope.loading = false;
                $scope.settings = settings.settings;
                $scope.setting = settings.settings[$scope.sensor.type];
            });
        };

        $scope.update = function () {
            var data = {
                name: $rootScope.settings.devicename,
                setting: $scope.settings
            };

            console.log('Settings ' + JSON.stringify(data));

            $rootScope.Skynet.updateDeviceSetting(data)
                .then(function () {
                    $rootScope.Skynet.logSensorData();
                }, $rootScope.redirectToError);
        };

        $scope.sendTracking = function () {
            if ($scope.sensor && typeof $rootScope.Sensors[$scope.sensor.label] === 'function') {
                var sensorObj = $rootScope.Sensors[$scope.sensor.label](3000);
                sensorObj.start(function (sensorData) {
                        var el = document.getElementById('sensorData');
                        if (el) {
                            var html = sensorObj.prettify(sensorData);
                            el.innerHTML = sensorObj.stream ? html + el.innerHTML : html;

                            $rootScope.settings.conn.data({
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

