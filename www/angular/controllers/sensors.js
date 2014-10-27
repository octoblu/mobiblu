'use strict';

angular.module('main.sensors')
  .controller('SensorCtrl',
    function($rootScope, $scope, $filter, $timeout, $routeParams, Skynet, Sensors) {

      $rootScope.loading = true;

      $scope.sensorTypes = [{
        type: 'accelerometer',
        label: 'Accelerometer',
        icon: 'fa fa-rss',
        graph: false
      }, {
        type: 'compass',
        label: 'Compass',
        icon: 'fa fa-compass',
        graph: 'compass'
      }, {
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
        paths: {}
      }];

      $scope.sensor = null;
      $scope.sensorObj = null;

      if ($routeParams.sensorType) {
        $scope.sensor = _.findWhere($scope.sensorTypes, { type : $routeParams.sensorType });
      }

      $scope.initList = function() {
        $rootScope.loading = false;
      };

      $scope.init = function() {
        $rootScope.loading = false;
        $scope.settings = Skynet.settings;
        $scope.setting = Skynet.settings[$scope.sensor.type];

        $scope.sensorObj = new Sensors[$scope.sensor.label](3000);

        graphSensor($scope.sensorObj.retrieve());
      };

      $scope.update = function() {
        var data = {
          name: Skynet.devicename,
          setting: $scope.settings
        };

        console.log('Settings ' + JSON.stringify(data));

        Skynet.updateMobibluSetting(data)
          .then(function() {
            Sensors.logSensorData(Skynet);
          }, $rootScope.redirectToError);
      };

      function graphSensor(stored) {
        if ($scope.sensor.graph === 'map') {

          $scope.sensor.paths.path = {
            color: 'red',
            weight: 8,
            latlngs: _.map(stored, function(item) {
              return {
                lat: item.coords.latitude,
                lng: item.coords.longitude
              };
            })
          };

          if (stored[0]) {
            $scope.sensor.center = {
              lat: stored[0].coords.latitude,
              lng: stored[0].coords.longitude,
              zoom: 8
            };
          }

        } else if ($scope.sensor.graph === 'compass') {
          $scope.sensor.heading = stored[0] ? stored[0].magneticHeading : 0;
        }
      }

      $scope.closeGraphModal = function() {
        $('#graphModal').removeClass('active');
      };

      $scope.openGraphModal = function() {
        $('#graphModal').addClass('active');
        $('#graphModal').height($('#content>.content').height());
        setTimeout(function() {
          $('#graphModal .bar').css('position', 'absolute');
        }, 500);
      };

      $scope.clearSensorGraph = function() {
        if ($scope.sensorObj) {
          $scope.sensorObj.clearStorage();
          graphSensor([]);
        }
      };

      $scope.sendTracking = function() {
        if (!$scope.sensorObj) return;
        var method, el = document.getElementById('sensorData');

        method = $scope.sensorObj.defaultMethod || 'start';
        $scope.sensorObj[method](function(sensorData, stored) {
            var html = $scope.sensorObj.prettify(sensorData);
            el.innerHTML = $scope.sensorObj.stream ? html + el.innerHTML : html;

            Skynet.sendData({
              'sensorData': {
                'type': $scope.sensor.label,
                'data': sensorData
              }
            }).then(function() {
              el.innerHTML = html + '<strong>Skynet Updated</strong><hr>';
            });

            graphSensor(stored);
          },
          function(err) {
            $scope.sensorObj.clear();
            console.log('Error: ', err);
            $timeout(function() {
              $rootScope.alertModal('Error', 'There was an error processing your "' + $scope.sensor.label + '" sensor.');
            });
          });
      };

      $scope.stopWatching = function() {
	      if (!$scope.sensorObj) return;

	     	$scope.sensorObj.clear();
      };

      $scope.toggleSwitch = function() {
        var setting = $scope.sensor.type;
        $scope.settings[setting] = !$scope.settings[setting];
        $scope.update();
      };

      $scope.$on('$locationChangeStart', function() {
        if ($scope.sensorObj) {
          $scope.sensorObj.clear();
        }
      });

    });