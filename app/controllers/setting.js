document.addEventListener("skynetready", function () {
    angular.bootstrap(document, ['settingApp']);
});

var settingApp = angular.module('settingApp', ['hmTouchevents', 'SkynetModel']);

// Index: http://localhost/views/setting/index.html

settingApp.controller('IndexCtrl', function ($scope, Skynet, SkynetRest) {

    // This will be populated with Restangula
    $scope.settings = {};

    var tokenmask = '*************************';
    $scope.loading = true;

    $scope.init = function(){
        $scope.devicename = window.localStorage.getItem("devicename");

        $scope.skynetuuid = window.localStorage.getItem("skynetuuid");
        $scope.skynettoken = window.localStorage.getItem("skynettoken");
        $scope.skynettoken_dummy = tokenmask;

        $scope.mobileuuid = window.localStorage.getItem("mobileuuid");
        $scope.mobiletoken = window.localStorage.getItem("mobiletoken");
        $scope.mobiletoken_dummy = tokenmask;
        Skynet.init(function(data){
            Skynet.getDeviceSetting($scope.mobileuuid, function(data){
                $scope.loading = false;
                $scope.$apply(function(){
                    $scope.devicename = data.name;
                    $scope.settings = data.setting || {};
                    console.log('Settings', JSON.stringify($scope.settings));
                });

            });
        });
        // SkynetRestangular.one('devices/' + $scope.mobileuuid).get().then( function(data) {
        //     alert(JSON.stringify(data));
        //     $scope.loading = false;
        // });
    };

    $scope.update = function(){
        $scope.loading = true;
        var data = {
            name : $scope.devicename,
            setting : $scope.settings
        };
        window.localStorage.setItem("devicename", data.name);
        console.log('Update', JSON.stringify(data));
        Skynet.updateDeviceSetting(data, function(rData){
            alert('Saved');
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

    $scope.toggleSwitch = function(setting){
        $scope.settings[setting] = !$scope.settings[setting];
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

settingApp.controller('ErrorsCtrl', function ($scope, Skynet, Sensors) {

    $scope.errors = [];

});
