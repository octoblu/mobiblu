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
]).run(function ($rootScope, $location, $q) {

    var loaded = false;

    var timeouts = [];

    $rootScope.loading = true;

    $rootScope.Skynet = window.Skynet;

    $rootScope.isDeveloper = false;

    $rootScope.matchRoute = function (route) {
        var regex = new RegExp('\\#\\!' + route);
        if (window.location.href.match(regex)) {
            return true;
        }
        return false;
    };

    var clearAppTimeouts = function(){
        timeouts.forEach(function(timeout, i){
            clearTimeout(timeout);
            timeouts.splice(i, 1);
        });
    };

    $rootScope.errorMsg = null;

    var isErrorPage = function(){
        if($rootScope.matchRoute('/error') ||
            $rootScope.matchRoute('/login')){
            return true;
        }
        return false;
    };

    var redirectToError = function(err, type){
        if(isErrorPage()) return false;
        clearAppTimeouts();
        console.log('Error! ', err);
        console.log('Redirecting to "' + type + '" Error');
        setTimeout(function(){
            $rootScope.$apply(function() {
                $rootScope.loading = false;
                $rootScope.errorMsg = err || '';
                $location.path('/error/' + type);
            });
        }, 0);
    };

    $rootScope.redirectToError = function (err) {
        redirectToError(err, 'basic');
    };

    $rootScope.redirectToCustomError = function (err) {
        redirectToError(err, 'custom');
    };

    $rootScope.redirectToLoginError = function (err) {
        redirectToError(err, 'login');
    };

    $rootScope.$on('$locationChangeSuccess', function(){
        clearAppTimeouts();
        timeouts.push(setTimeout(function(){
            console.log('Loading :: ' + $rootScope.loading);
            if($rootScope.loading){
                $rootScope.redirectToError('Request Timeout.');
            }
        }, 1000 * 20));
    });

    var skynetLoad = _.once(function () {
        var deferred = $q.defer();
        $(document).one('skynet-loaded', function () {
            loaded = true;
            console.log('SKYNET LOADED EVENT :: ' + JSON.stringify(loaded));
            deferred.resolve();
        });

        timeouts.push(setTimeout(deferred.reject, 1000 * 15));

        return deferred.promise;
    });

    $rootScope.ready = function (cb) {
        $rootScope.setSettings();
        if (loaded || isErrorPage()) cb();
        else skynetLoad().then(cb, $rootScope.redirectToError);
    };

    $rootScope.setSettings = function () {
        $rootScope.settings = $rootScope.Skynet.getCurrentSettings();

        $rootScope.loggedin = $rootScope.settings.loggedin;

        $rootScope.isDeveloper = $rootScope.settings.settings.developer_mode;
    };

    $rootScope.isAuthenticated = function () {
        if (!$rootScope.loggedin) {
            if (!$rootScope.matchRoute('/login')) $location.path('/login');
            return false;
        } else {
            return true;
        }
    };

    var pluginsLoaded = false;

    var pluginReady = _.once(function(){
        var deferred = $q.defer();

        if(pluginsLoaded || isErrorPage()){
            deferred.resolve();
        }else{
            $(document).one('plugins-loaded', function(){
                console.log('Plugins Loaded Event');
                pluginsLoaded = true;
                deferred.resolve();
            });
        }

        timeouts.push(setTimeout(deferred.reject, 1000 * 15));

        return deferred.promise;
    });

    $rootScope.pluginReady = function(cb){
        pluginReady().then(function(){
            console.log('Plugins Loaded');
            cb();
        }, $rootScope.redirectToError);
    };

    var skynetInit = function () {
        var deferred = $q.defer();

        if(isErrorPage()){
            deferred.reject();
        }else {
            $rootScope.Skynet.init().timeout(1000 * 15)
                .then(function () {
                    console.log('SKYNET INIT\'d');
                    deferred.resolve();
                }, $rootScope.redirectToError);
        }
        return deferred.promise;
    };

    skynetInit().then(function () {
            console.log('SKYNET LOADED');

            $rootScope.Sensors = $rootScope.Skynet.Sensors;

            $rootScope.setSettings();

            $rootScope.$on('$locationChangeSuccess', function () {
                $rootScope.settings = $rootScope.Skynet.getCurrentSettings();
                $('.content').css('height', '100%');
            });

            $rootScope.isAuthenticated();

            $rootScope.loading = false;
            if($rootScope.settings && $rootScope.settings.conn){
                $rootScope.settings.conn.on('message', function(data){
                        $rootScope.$emit('skynet:message', data);
                    });
            }


        },
        $rootScope.redirectToError);

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
