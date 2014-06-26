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
    .run(function ($rootScope) {

        var loaded = false;

        $rootScope.loading = true;

        $rootScope.Skynet = null;

        var skynetLoad = function(cb){
            $(document).on('skynet-loaded', function(){
                loaded = true;
                //console.log('SKYNET LOADED EVENT :: ' + JSON.stringify(loaded));
                if(cb) cb();
            });
        };

        skynetLoad();

        $rootScope.ready = function(cb){
            if(loaded) cb();
            else skynetLoad(cb);
        };

        window.Skynet.init(function () {
            console.log('SKYNET LOADED');

            $rootScope.loading = false;

            $rootScope.Skynet = window.Skynet;

            $rootScope.Sensors = $rootScope.Skynet.Sensors;

            $rootScope.settings = $rootScope.Skynet.getCurrentSettings();

            $rootScope.$on('$locationChangeSuccess', function() {
                $rootScope.settings = $rootScope.Skynet.getCurrentSettings();
            });

        });

        $rootScope.matchRoute = function (route) {
            var regex = new RegExp('\\#\\!' + route);
            if (window.location.href.match(regex)) {
                return true;
            }
            return false;
        };

        $rootScope.isAuthenticated = function(){
            return $rootScope.Skynet.isAuthenticated;
        };

    });

angular.module('main.system', []);
angular.module('main.home', []);
angular.module('main.messages', []);
angular.module('main.setting', []);
angular.module('main.sensors', ['ngSanitize']);
angular.module('main.plugins', []);
angular.module('main.flows', []);
