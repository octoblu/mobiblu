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
            .when('/sensors/errors', {
                templateUrl: '/public/views/sensors/errors.html'
            })
            .when('/sensors/:sensorType', {
                templateUrl: '/public/views/sensors/view.html'
            })
            .when('/sensors', {
                templateUrl: '/public/views/sensors/list.html'
            })
            .when('/setting', {
                templateUrl: '/public/views/setting/index.html'
            })
            .when('/messages', {
                templateUrl: '/public/views/messages/index.html'
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
