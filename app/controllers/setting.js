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
            $scope.loading = false;
            $scope.devicename = data.name;
            $scope.settings = data.setting || {};
        });
        SkynetRest.getDevice($scope.mobileuuid, function(data){
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
        console.log(data);
        window.localStorage.setItem("devicename", data.name);
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

settingApp.directive('switchButton', function() {
    return {
        require: 'ngModel',
        restrict: 'E',
        template: '<div class="toggle pull-right" ng-click="toggle()">' +
            '<div class="toggle-handle"></div>' +
        '</div>',
        link: function($scope, element, attrs, controller) {
            var toggleClass = function(elem, className) {
                var newClass = ' ' + elem.className.replace( /[\t\r\n]/g, ' ' ) + ' ';
                if (hasClass(elem, className)) {
                    while (newClass.indexOf(' ' + className + ' ') >= 0 ) {
                        newClass = newClass.replace( ' ' + className + ' ' , ' ' );
                    }
                    elem.className = newClass.replace(/^\s+|\s+$/g, '');
                } else {
                    elem.className += ' ' + className;
                }
            };
            var removeClass = function (elem, className) {
                var newClass = ' ' + elem.className.replace( /[\t\r\n]/g, ' ') + ' ';
                if (hasClass(elem, className)) {
                    while (newClass.indexOf(' ' + className + ' ') >= 0 ) {
                        newClass = newClass.replace(' ' + className + ' ', ' ');
                    }
                    elem.className = newClass.replace(/^\s+|\s+$/g, '');
                }
            };
            var addClass = function(elem, className) {
                if (!hasClass(elem, className)) {
                    elem.className += ' ' + className;
                }
            };
            var hasClass = function (elem, className) {
                return new RegExp(' ' + className + ' ').test(' ' + elem.className + ' ');
            };
            $scope.toggle = function(val){
                var newValue = val || !controller.$modelValue;
                if(newValue){
                    addClass(element, 'active');
                }else{
                    removeClass(element, 'active');
                }
                controller.$setViewValue(newValue);
            };
            controller.$render = function() {
                var current = controller.$modelValue;
                $scope.toggle(current);
            };
        }
    };
});
