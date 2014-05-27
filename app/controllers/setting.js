'use strict';

var settingApp = angular.module('main.setting', ['hmTouchevents', 'SkynetModel']);

// Index: http://localhost/views/setting/index.html

settingApp.controller('SettingCtrl', function ($scope, Skynet, SkynetRest, OctobluRest) {

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
        $scope.devicename = Skynet.devicename;

        $scope.skynetuuid = Skynet.skynetuuid;
        $scope.skynettoken = Skynet.skynettoken;

        $scope.mobileuuid = Skynet.mobileuuid;
        $scope.mobiletoken = Skynet.mobiletoken;

        $scope.skynettoken_dummy = tokenmask;
        $scope.mobiletoken_dummy = tokenmask;

        $scope.settings = Skynet.settings;

        $scope.loggedin = Skynet.loggedin;

        if ($scope.loggedin &&
             $scope.skynetuuid &&
             $scope.skynettoken) {

            Skynet.init(function (data) {
                Skynet.getDeviceSetting($scope.mobileuuid, function (data) {
                    $scope.loading = false;
                    $scope.$apply(function () {
                        $scope.devicename = data.name;
                        if (data.setting) {
                            $scope.settings = Skynet.settings = data.setting;
                        } else {
                            $scope.update();
                        }
                    });
                });
            });
        }
    };

    $scope.update = function () {
        $scope.loading = true;
        var data = {
            name: $scope.devicename,
            setting: $scope.settings
        };
        Skynet.settings = data.setting;

        window.localStorage.setItem("devicename", data.name);

        Skynet.updateDeviceSetting(data, function (rData) {
            $scope.loading = false;
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

    // Get notified when an another webview modifies the data and reload
    window.addEventListener("message", function (event) {
        // reload data on message with reload status
        if (event.data.status === "reload") {}
    });

    $scope.toggleSwitch = function (setting) {
        $scope.settings[setting] = !$scope.settings[setting];
        $scope.update();
    };
});
