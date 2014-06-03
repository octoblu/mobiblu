'use strict';

var settingApp = angular.module('main.setting', ['hmTouchevents', 'SkynetModel']);

// Index: http://localhost/views/setting/index.html

settingApp.controller('SettingCtrl', function ($scope, Skynet) {

    $(document).trigger('togglebackbtn', false);

    // This will be populated with Restangula
    $scope.settings = {};

    var tokenmask = '*************************';
    $scope.loading = true;

    // Set up minutes
    $scope.minutes = [];
    for (var i = 0; i < (60 * 3); i++) {
        $scope.minutes.push(i);
    }

    $scope.init = function () {

        $scope.skynettoken_dummy = tokenmask;
        $scope.mobiletoken_dummy = tokenmask;

        $scope.loggedin = Skynet.loggedin;
        Skynet.init(function () {
            var settings = Skynet.getCurrentSettings();
            $scope.skynetuuid = settings.skynetuuid;
            $scope.skynettoken = settings.skynettoken;

            $scope.mobileuuid = settings.mobileuuid;
            $scope.mobiletoken = settings.mobiletoken;

            $scope.devicename = settings.devicename;
            $scope.settings = settings.settings;
            console.log('Settings', JSON.stringify($scope.settings));
        });
    };

    $scope.update = function () {
        var data = {
            name: $scope.devicename,
            setting: $scope.settings
        };
        Skynet.settings = data.setting;

        window.localStorage.setItem('devicename', data.name);

        Skynet.updateDeviceSetting(data, function () {
            Skynet.logSensorData();
        });
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

    $scope.toggleSwitch = function (setting) {
        $scope.settings[setting] = !$scope.settings[setting];
        $scope.update();
    };
});
