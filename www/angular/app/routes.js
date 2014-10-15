'use strict';

angular.module('main').config(['$routeProvider',
    function ($routeProvider) {
        $routeProvider
            .when('/', {
                templateUrl: '/angular/views/home/dashboard.html'
            })
            .when('/login', {
                templateUrl: '/angular/views/user/login.html'
            })
            .when('/accept_terms', {
                templateUrl: '/angular/views/user/accept_terms.html'
            })
            .when('/plugins', {
                templateUrl: '/angular/views/plugins/index.html'
            })
            .when('/plugins/search', {
                templateUrl: '/angular/views/plugins/search.html'
            })
            .when('/plugins/installed', {
                templateUrl: '/angular/views/plugins/installed.html'
            })
            .when('/plugins/devices', {
                templateUrl: '/angular/views/plugins/list.html'
            })
            .when('/plugins/device/:pluginName/:deviceId/:configure', {
                templateUrl: '/angular/views/plugins/device.html'
            })
            .when('/plugins/:pluginName', {
                templateUrl: '/angular/views/plugins/view.html'
            })
            .when('/sensors/:sensorType', {
                templateUrl: '/angular/views/sensors/view.html'
            })
            .when('/sensors', {
                templateUrl: '/angular/views/sensors/list.html'
            })
            .when('/flows', {
                templateUrl: '/angular/views/flows/list.html'
            })
            .when('/flows/:flowId', {
                templateUrl: '/angular/views/flows/edit.html'
            })
            .when('/setting', {
                templateUrl: '/angular/views/setting/index.html'
            })
            .when('/messages', {
                templateUrl: '/angular/views/messages/index.html'
            })
            .when('/error/basic', {
                templateUrl: '/angular/views/system/error.html'
            })
            .when('/error/custom', {
                templateUrl: '/angular/views/system/custom_error.html'
            })
            .when('/error/login', {
                templateUrl: '/angular/views/system/login_error.html'
            })
            .when('/activity', {
                templateUrl: '/angular/views/system/activity.html'
            })
            .otherwise({
                redirectTo: '/'
            });
    }
]);
