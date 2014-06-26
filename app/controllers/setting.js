'use strict';

var settingApp = angular.module('main.setting', ['hmTouchevents', 'SkynetModel']);

// Index: http://localhost/views/setting/index.html

settingApp.controller('SettingCtrl', function ($rootScope, $scope) {

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
        $rootScope.ready(function(){
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

    $scope.update = function () {
        var data = {
            name: $scope.devicename,
            setting: $scope.settings
        };

        console.log('Settings ' + JSON.stringify(data));

        $rootScope.Skynet.updateDeviceSetting(data, function () {
            $rootScope.Skynet.logSensorData();
        });
    };

    $scope.clearPlugins = function(){
        if(confirm('Are you sure you want to clear the plugins?')){
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

    $scope.toggleSwitch = function (setting) {
        $scope.settings[setting] = !$scope.settings[setting];
        $scope.update();
    };
});
