'use strict';

angular.module('main').config(['$routeProvider',
    function ($routeProvider) {
        $routeProvider
            .when('/', {
                templateUrl: '/public/views/home/index.html'
            })
            .when('/login', {
                templateUrl: '/public/views/home/login.html'
            })
            .when('/plugins', {
                templateUrl: '/public/views/plugins/index.html'
            })
            .when('/plugins/search', {
                templateUrl: '/public/views/plugins/search.html'
            })
            .when('/plugins/installed', {
                templateUrl: '/public/views/plugins/installed.html'
            })
            .when('/plugins/devices', {
                templateUrl: '/public/views/plugins/list.html'
            })
            .when('/plugins/device/:pluginName/:deviceId', {
                templateUrl: '/public/views/plugins/device.html'
            })
            .when('/plugins/:pluginName', {
                templateUrl: '/public/views/plugins/view.html'
            })
            .when('/sensors/:sensorType', {
                templateUrl: '/public/views/sensors/view.html'
            })
            .when('/sensors', {
                templateUrl: '/public/views/sensors/list.html'
            })
            .when('/flows', {
                templateUrl: '/public/views/flows/list.html'
            })
            .when('/setting', {
                templateUrl: '/public/views/setting/index.html'
            })
            .when('/messages', {
                templateUrl: '/public/views/messages/index.html'
            })
            .when('/error', {
                templateUrl: '/public/views/system/error.html'
            })
            .when('/error/custom', {
                templateUrl: '/public/views/system/custom_error.html'
            })
            .when('/activity', {
                templateUrl: '/public/views/system/activity.html'
            })
            .otherwise({
                redirectTo: '/'
            });
    }
]);

//Setting HTML5 Location Mode
angular.module('main').config(['$locationProvider',
    function ($locationProvider) {
        $locationProvider.hashPrefix('!');
    }
]);
