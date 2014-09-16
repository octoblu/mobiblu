'use strict';

angular.module('main')
    .run(function ($rootScope, $timeout, $location, $q, Plugins, Auth, SkynetRest, Skynet, Config) {

        var timeouts = [];

        $rootScope.loading = true;

        $rootScope.isDeveloper = false;

        $rootScope.Config = Config;

        $rootScope.matchRoute = function (route) {
            var regex = new RegExp('\\#\\!' + route);
            var path = window.location.href.split('?')[0];
            if (path.match(regex)) {
                return true;
            }
            return false;
        };

        $rootScope.clearAppTimeouts = function () {
            timeouts.forEach(function (timeout, i) {
                clearTimeout(timeout);
                timeouts.splice(i, 1);
            });
        };

        $rootScope.errorMsg = null;

        $rootScope.isErrorPage = function () {
            if ($rootScope.matchRoute('/error')) {
                return true;
            }
            return false;
        };

        var redirectToError = function (err, type) {
            if ($rootScope.isErrorPage()) return false;
            $rootScope.clearAppTimeouts();
            console.log('Error! ' + err);
            console.log('Redirecting to "' + type + '" Error');
            $timeout(function () {
                $rootScope.loading = false;
                $rootScope.errorMsg = err || '';
                $location.path('/error/' + type);
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

        $rootScope.$on('$locationChangeSuccess', function () {
            //$rootScope.loading = false;
            $rootScope.clearAppTimeouts();
            timeouts.push(setTimeout(function () {
                console.log('Loading :: ' + $rootScope.loading);
                if ($rootScope.loading) {
                    $rootScope.redirectToError('Request Timeout.');
                }
            }, 1000 * 20));
        });

        $rootScope.setSettings = function () {
            $rootScope.settings = Skynet.getCurrentSettings();

            $rootScope.loggedin = $rootScope.settings.loggedin;

            $rootScope.skynetuuid = $rootScope.settings.skynetuuid;
            $rootScope.skynettoken = $rootScope.settings.skynettoken;

            $rootScope.mobileuuid = $rootScope.settings.mobileuuid;
            $rootScope.mobiletoken = $rootScope.settings.mobiletoken;

            $rootScope.isDeveloper = $rootScope.settings.settings ? $rootScope.settings.settings.developer_mode : false;

            console.log('in $rootScope.setSettings() ++ ' + $rootScope.settings.skynetuuid);

        };

        $rootScope.footerDisabled = false;

        $rootScope.isAuthenticated = function () {
            if (!$rootScope.loggedin) {
                if (!$rootScope.matchRoute('/login')) {
                    console.log('Redirecting to login');
                    $location.path('/login');
                }
                return false;
            } else {
                if ($rootScope.matchRoute('/login')) {
                    console.log('Redirecting to homepage');
                    $location.path('/');
                }
                return true;
            }
        };

        $rootScope.setSettings();

        Skynet.start().then(Plugins.init);

        // Modals

        $rootScope.alertModal = function (title, msg) {
            $rootScope.globalModal = {};
            $rootScope.globalModal.title = title;
            $rootScope.globalModal.msg = msg;

            $('#globalModal').addClass('active');
        };

        $rootScope.closeModal = function () {
            $rootScope.globalModal = {};
            $('#globalModal').removeClass('active');
        };

    });