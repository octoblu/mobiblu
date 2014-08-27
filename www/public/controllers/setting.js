'use strict';

angular.module('main.setting')
    .controller('SettingCtrl', function ($rootScope, $scope, $q) {

        $rootScope.$on('togglebackbtn', false);

        // This will be populated with Restangula
        $scope.device = {
            settings : {},
            name : ''
        };

        var tokenmask = '*************************';
        $rootScope.loading = true;

        // Set up minutes
        $scope.minutes = [ 0.15 ];
        for (var i = 1; i < 179; i++) {
            $scope.minutes.push(i);
        }

        $scope.init = function () {
            $rootScope.ready(function () {
                $scope.skynettoken_dummy = tokenmask;
                $scope.mobiletoken_dummy = tokenmask;

                var settings = $rootScope.settings;

                console.log('Load-Settings ' + JSON.stringify([settings.devicename, settings.settings]));

                $scope.device.name = settings.devicename;
                $scope.device.settings = settings.settings;

                $rootScope.loading = false;
            });
        };

        var _update = function () {
            var deferred = $q.defer();

            var data = {
                name: $scope.device.name,
                setting: $scope.device.settings
            };

            $rootScope.Skynet.updateDeviceSetting(data)
                .timeout(1000 * 15)
                .then(function () {
                    $rootScope.Skynet.logSensorData();
                    deferred.resolve();
                }, $rootScope.redirectToError);

            return deferred.promise;
        };

        $scope.update = function (val, key) {

            if(typeof val !== 'undefined' && typeof key !== 'undefined'){
                $scope.device.settings[key] = val;
            }
            console.log('Pre-Save-Settings ' + JSON.stringify($scope.device));
            _update().then(function () {
                $rootScope.setSettings();
            }, $rootScope.redirectToError);
        };

        $scope.clearPlugins = function () {
            if (confirm('Are you sure you want to clear the plugins?')) {
                window.octobluMobile.clearStorage();
                window.location = 'index.html';
            }
        };

        $scope.revealMobileToken = function () {
            if ($scope.mobiletoken_dummy.match(/^\**$/)) {
                $scope.mobiletoken_dummy = $scope.mobiletoken;
            } else {
                $scope.mobiletoken_dummy = tokenmask;
            }
        };

        $scope.revealUserToken = function () {
            if ($scope.skynettoken_dummy.match(/^\**$/)) {
                $scope.skynettoken_dummy = $scope.skynettoken;
            } else {
                $scope.skynettoken_dummy = tokenmask;
            }
        };

        $scope.bgInfo = function(){
            $rootScope.alertModal('Background Information',
                'If background location updates are enabled, ' +
                    'your device will send data to Meshblu when ' +
                    'there is a significant change in your background location. ' +
                    'By default background location is default. '
            );
        };

        $scope.updateInfo = function(){
            $rootScope.alertModal('Sensor Information',
                    'Sensors ( Compass, Accelerometer, Geolocation )' +
                    ' are sent to Meshblu on a specific interval ' +
                        'which you can adjust on the settings page. ' +
                        'Sensors can also be individually enabled or disabled. ' +
                        'By default sensor\'s are disabled. '
            );
        };

    });
