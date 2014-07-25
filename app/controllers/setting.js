'use strict';

angular.module('main.setting')
    .controller('SettingCtrl', function ($rootScope, $scope, $q) {

        $rootScope.$on('togglebackbtn', false);

        // This will be populated with Restangula
        $scope.settings = {};

        var tokenmask = '*************************';
        $rootScope.loading = true;

        // Set up minutes
        $scope.minutes = [];
        for (var i = 0; i < (60 * 3); i++) {
            $scope.minutes.push(i);
        }

        $scope.init = function () {
            $rootScope.ready(function () {
                $scope.skynettoken_dummy = tokenmask;
                $scope.mobiletoken_dummy = tokenmask;

                var settings = $rootScope.settings;
                console.log('Settings ' + JSON.stringify(settings.settings));
                $scope.loggedin = settings.loggedin;
                $scope.skynetuuid = settings.skynetuuid;
                $scope.skynettoken = settings.skynettoken;

                $scope.mobileuuid = settings.mobileuuid;
                $scope.mobiletoken = settings.mobiletoken;

                $scope.devicename = settings.devicename;
                $scope.settings = settings.settings;

                $rootScope.loading = false;
            });
        };

        var update = function () {
            var deferred = $q.defer();

            var data = {
                name: $scope.devicename,
                setting: $scope.settings
            };

            console.log('Settings ' + JSON.stringify(data));

            $rootScope.Skynet.updateDeviceSetting(data)
                .timeout(1000 * 15)
                .then(function () {
                    $rootScope.Skynet.logSensorData();
                    deferred.resolve();
                }, $rootScope.redirectToError);

            return deferred.promise;
        };

        $scope.update = function () {
            update().then(function () {
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

    });
