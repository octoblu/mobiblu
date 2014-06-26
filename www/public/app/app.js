'use strict';

angular.module('main', [
    'ngRoute',
    'ui.route',
    'main.system',
    'main.home',
    'main.sensors',
    'main.plugins',
    'main.flows',
    'main.messages',
    'main.setting'
])
    .run(function ($rootScope, $location) {

        var loaded = false;

        $rootScope.loading = true;

        $rootScope.Skynet = window.Skynet;

        $rootScope.matchRoute = function (route) {
            var regex = new RegExp('\\#\\!' + route);
            if (window.location.href.match(regex)) {
                return true;
            }
            return false;
        };

        var skynetLoad = function(cb){
            $(document).on('skynet-loaded', function(){
                loaded = true;
                //console.log('SKYNET LOADED EVENT :: ' + JSON.stringify(loaded));
                if(cb) cb();
            });
        };

        $rootScope.ready = function(cb){
            if(loaded) cb();
            else skynetLoad(cb);
        };

        $rootScope.setSettings = function(){
            $rootScope.settings = $rootScope.Skynet.getCurrentSettings();

            $rootScope.loggedin = $rootScope.settings.loggedin;
        };

        $rootScope.isAuthenticated = function(){
            if(!$rootScope.loggedin){
                if(!$rootScope.matchRoute('/login')) $location.path('/login');
                return false;
            }else{
                return true;
            }
        };


        $rootScope.Skynet.init(function () {
            console.log('SKYNET LOADED');

            $rootScope.loading = false;

            $rootScope.Sensors = $rootScope.Skynet.Sensors;

            $rootScope.setSettings();

            $rootScope.$on('$locationChangeSuccess', function() {
                $rootScope.settings = $rootScope.Skynet.getCurrentSettings();
            });

            $rootScope.isAuthenticated();

        });

        skynetLoad();

        $rootScope.setSettings();

        $rootScope.isAuthenticated();

    });

angular.module('main.system', []);
angular.module('main.home', []);
angular.module('main.messages', []);
angular.module('main.setting', []);
angular.module('main.sensors', ['ngSanitize']);
angular.module('main.plugins', []);
angular.module('main.flows', []);
