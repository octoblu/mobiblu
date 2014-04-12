document.addEventListener("skynetready", function () {
    angular.bootstrap(document, ['settingApp']);
});

var settingApp = angular.module('settingApp', ['hmTouchevents']);

// Index: http://localhost/views/setting/index.html

settingApp.controller('IndexCtrl', function ($scope) {

    // This will be populated with Restangular
    $scope.settings = [];

    // Helper function for loading setting data with spinner
    $scope.loadSettings = function () {
        $scope.loading = false;
    };

    var tokenmask = '*************************';

    $scope.devicename = window.localStorage.getItem("devicename");

    $scope.skynetuuid = window.localStorage.getItem("skynetuuid");
    $scope.skynettoken = window.localStorage.getItem("skynettoken");
    $scope.skynettoken_dummy = tokenmask;

    $scope.mobileuuid = window.localStorage.getItem("mobileuuid");
    $scope.mobiletoken = window.localStorage.getItem("mobiletoken");
    $scope.mobiletoken_dummy = tokenmask;

    Skynet.getDeviceSetting(function(data){
        $scope.devicename = data.name;
        $scope.settings = data.setting || {};
    });

    $scope.update = function(){
        $scope.loading = true;
        var data = {
            name : $scope.devicename,
            setting : {
                bg_updates : !! $scope.settings.bg_updates,
                bg_update_interval : $scope.settings.bg_update_interval
            }
        };
        window.localStorage.setItem("devicename", data.name);
        Skynet.updateDeviceSetting(data, function(rData){
            $scope.loading = false;
        });
    };

    $scope.revealMobileToken = function(){
        if($scope.mobiletoken_dummy.match(/^\**$/)){
            $scope.mobiletoken_dummy = $scope.mobiletoken;
        }else{
            $scope.mobiletoken_dummy = tokenmask;
        }
    };

    $scope.revealUserToken = function(){
        if($scope.skynettoken_dummy.match(/^\**$/)){
            $scope.skynettoken_dummy = $scope.skynettoken;
        }else{
            $scope.skynettoken_dummy = tokenmask;
        }
    };

    // Get notified when an another webview modifies the data and reload
    window.addEventListener("message", function (event) {
        // reload data on message with reload status
        if (event.data.status === "reload") {}
    });


    $scope.logout = function(){
        window.localStorage.removeItem("skynetuuid");
        window.localStorage.removeItem("skynettoken");
    };

    // -- Native navigation

    var rightButton = new steroids.buttons.NavigationBarButton();

    rightButton.title = "Logout";
    rightButton.onTap = function() {
        $scope.logout();
        webView = new steroids.views.WebView('/views/home/index.html');
        steroids.layers.push(webView);
    };

    steroids.view.navigationBar.setButtons({
      right: [rightButton],
      overrideBackButton: false
    });
});

settingApp.controller('ErrorsCtrl', function ($scope) {

    $scope.errors = [];
    
});
