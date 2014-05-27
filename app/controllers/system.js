'use strict';

var systemApp = angular.module('main.system', ['SkynetModel']);

var matchRoute = function(route){
    var regex = new RegExp('\\#\\!' + route);
    if(window.location.href.match(regex)){
        return true;
    }
    return false;
};

systemApp.controller('SubHeaderCtrl',
    function ($scope) {

        $scope.activity = true;

        $scope.showActivity = function(){
            var excludes = [
                '/login$'
            ];
            for(var x in excludes){
                var exclude = excludes[x];
                if(matchRoute(exclude)) {
                    $scope.activity = false;
                    return false;
                }
            }

            $scope.activity = true;
            return true;
        };

        $scope.showActivity();
});

systemApp.controller('HeaderCtrl',
    function ($scope, Skynet, $location) {


        // TODO improve this functionality for multiple levels
        $scope.backbtn = false;

        $(document).on('togglebackbtn', function(e, val){
            $scope.backbtn = val;
        });

        $scope.goBack = function(){
            window.history.back();
        };

        $scope.logout = function(){
            Skynet.logout();

            $scope.loggedin = Skynet.loggedin;

            window.location = 'http://octoblu.com/logout?referrer=' + encodeURIComponent('http://localhost/#!/login');
        };

        $scope.loggedin = Skynet.loggedin;

        $scope.init = function(){
            if(!Skynet.isAuthenticated()){
                $location.path('login');
                return;
            }
        };
});


systemApp.controller('FooterCtrl', function ($scope, Skynet) {
    $scope.isActive = function(route){
        if(route === '/'){
            route += '$'; // Make sure regex finds the end
        }
        return matchRoute(route);
    };

    $scope.init = function(){
        if(!Skynet.isAuthenticated()){
            $scope.disabled = true;
            return;
        }
    };
});
