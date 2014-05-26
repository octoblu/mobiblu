'use strict';

var systemApp = angular.module('main.system', ['SkynetModel']);

systemApp.controller('HeaderCtrl',
    function ($scope, Skynet, $location) {
        $scope.showActivity = function(){
            var regex = new RegExp('\\#\\!/$');
            if(window.location.href.match(regex)){
                return true;
            }
            return false;
        };

        $scope.backbtn = false;

        $scope.logout = function(){
            Skynet.logout();

            $scope.loggedin = Skynet.loggedin;

            window.location = 'http://octoblu.com/logout?referrer=' + encodeURIComponent('http://localhost/#!/login');
        };

        $scope.loggedin = Skynet.loggedin;
        console.log('Logged in', JSON.stringify($scope.loggedin));

        $scope.init = function(){
            if(!Skynet.isAuthenticated()){
                $location.path('login');
                return;
            }
        };
});


systemApp.controller('FooterCtrl', function ($scope, Skynet) {
    $scope.isActive = function(route){
        var regex = new RegExp('\\#\\!' + route + '$');
        if(window.location.href.match(regex)){
            return true;
        }
        return false;
    };

    $scope.init = function(){
        if(!Skynet.isAuthenticated()){
            $scope.disabled = true;
            return;
        }
    };
});
