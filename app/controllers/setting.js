document.addEventListener("skynetready", function () {
    angular.bootstrap(document, ['settingApp']);
});

var settingApp = angular.module('settingApp', ['hmTouchevents', 'SkynetModel']);

// Index: http://localhost/views/setting/index.html

settingApp.controller('IndexCtrl', function ($scope, Skynet, SkynetRest, OctobluRest) {

    // This will be populated with Restangula
    $scope.settings = {};

    var tokenmask = '*************************';
    $scope.loading = true;

    $scope.minutes = [];

    for (var i = 0; i < (60 * 3); i++) {
        $scope.minutes.push(i);
    }

    $scope.init = function () {
        $scope.devicename = window.localStorage.getItem("devicename");

        $scope.skynetuuid = window.localStorage.getItem("skynetuuid");
        $scope.skynettoken = window.localStorage.getItem("skynettoken");
        $scope.skynettoken_dummy = tokenmask;

        $scope.mobileuuid = window.localStorage.getItem("mobileuuid");
        $scope.mobiletoken = window.localStorage.getItem("mobiletoken");
        $scope.mobiletoken_dummy = tokenmask;

        $scope.loggedin = !! window.localStorage.getItem("loggedin");

        var rightButton = new steroids.buttons.NavigationBarButton();

        window.rightButtonSet = true;
        rightButton.title = "Logout";
        rightButton.onTap = function () {
            $scope.logout(function () {
                window.location.href="http://octoblu.com/logout?referrer=" + encodeURIComponent("http://localhost/logout.html");
            });
        };

        steroids.view.navigationBar.setButtons({
            right: [rightButton],
            overrideBackButton: false
        });

        if ($scope.loggedin && $scope.skynetuuid && $scope.skynettoken) {


            Skynet.init(function (data) {
                Skynet.getDeviceSetting($scope.mobileuuid, function (data) {
                    $scope.loading = false;
                    $scope.$apply(function () {
                        $scope.devicename = data.name;
                        if (data.setting) {
                            $scope.settings = data.setting;
                        } else {
                            $scope.settings = {
                                compass: true,
                                accelerometer: true,
                                geolocation: true,
                                update_interval: 1,
                                bg_updates: 0
                            };
                            $scope.update();
                        }
                        console.log('Settings', JSON.stringify($scope.settings));
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
        window.localStorage.setItem("devicename", data.name);
        console.log('Update', JSON.stringify(data));
        Skynet.updateDeviceSetting(data, function (rData) {
            console.log('Update', JSON.stringify(rData));
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


    $scope.logout = function (callback) {
        $scope.loggedin = false;
        window.loggedin = $scope.loggedin;
        window.localStorage.removeItem('loggedin');
        console.log("Logging out!! ", window.localStorage.getItem("loggedin"));
        window.rightButtonSet = false;
        callback();
    };

    $scope.toggleSwitch = function (setting) {
        $scope.settings[setting] = !$scope.settings[setting];
        $scope.update();
    };
});

settingApp.controller('ErrorsCtrl', function ($scope, Skynet, Sensors) {

    $scope.errors = [];

    Skynet.init(function () {});
});
