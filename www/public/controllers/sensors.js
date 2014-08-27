'use strict';

angular.module('main.sensors')
    .controller('SensorCtrl',
    function ($rootScope, $scope, $filter, $timeout, $routeParams) {

        $rootScope.loading = true;

        $scope.sensorTypes = [
            {
                type: 'accelerometer',
                label: 'Accelerometer',
                icon: 'fa fa-rss',
                graph: false
            },
            {
                type: 'compass',
                label: 'Compass',
                icon: 'fa fa-compass',
                graph: 'compass'
            },
            {
                type: 'geolocation',
                label: 'Geolocation',
                icon: 'fa fa-crosshairs',
                graph: 'map',
                defaults: {
                    maxZoom: 14,
                    path: {
                        weight: 10,
                        color: '#800000',
                        opacity: 1
                    }
                },
                center: {},
                paths: {
                }
            }
        ];

        $scope.sensor = null;
        $scope.sensorObj = null;

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

        $scope.initList = function () {
            $rootScope.loading = false;
        };

        $scope.init = function () {
            $rootScope.ready(function () {
                var settings = $rootScope.settings;
                $rootScope.loading = false;
                $scope.settings = settings.settings;
                $scope.setting = settings.settings[$scope.sensor.type];

                if ($scope.sensor && typeof $rootScope.Sensors[$scope.sensor.label] === 'function') {
                    $scope.sensorObj = $rootScope.Sensors[$scope.sensor.label](3000);

                    graphSensor($scope.sensorObj.retrieve());
                }

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

        function graphSensor(stored) {
            if ($scope.sensor.graph === 'map') {

                $scope.sensor.paths.path = {
                    color: 'red',
                    weight: 8,
                    latlngs: _.map(stored, function (item) {
                        return { lat: item.coords.latitude, lng: item.coords.longitude };
                    })
                };

                if (stored[0]) {
                    $scope.sensor.center = {
                        lat: stored[0].coords.latitude,
                        lng: stored[0].coords.longitude,
                        zoom: 8
                    };
                }

            }else if($scope.sensor.graph === 'compass'){
                $scope.sensor.heading = stored[0] ? stored[0].magneticHeading : 0;
            }
        }

        $scope.closeGraphModal = function(){
            $('#graphModal').removeClass('active');
        };

        $scope.openGraphModal = function(){
            $('#graphModal').addClass('active');
            $('#graphModal').height($('#content>.content').height());
        };

        $scope.clearSensorGraph = function() {
            if ($scope.sensorObj) {
                $scope.sensorObj.clearStorage();
                graphSensor([]);
            }
        };

        $scope.sendTracking = function () {
            if($scope.sensorObj){
                $scope.sensorObj.start(function (sensorData, stored) {
                        var el = document.getElementById('sensorData');
                        if (el) {
                            var html = $scope.sensorObj.prettify(sensorData);
                            el.innerHTML = $scope.sensorObj.stream ? html + el.innerHTML : html;

                            $rootScope.Skynet.sendData({
                                'sensorData': {
                                    'type': $scope.sensor.label,
                                    'data': sensorData
                                }
                            }).then(function () {
                                el.innerHTML = html + '<strong>Skynet Updated</strong><hr>';
                            });
                        }

                        graphSensor(stored);
                    },
                    function (err) {
                        console.log('Error: ', err);
                        $timeout(function(){
                            $rootScope.alertModal('Error', 'There was an error processing your "' + $scope.sensor.label + '" sensor.');
                        });
                    });
            }
        };

        $scope.toggleSwitch = function () {
            var setting = $scope.sensor.type;
            $scope.settings[setting] = !$scope.settings[setting];
            $scope.update();
        };

    });