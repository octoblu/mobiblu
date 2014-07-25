'use strict';

//Setting HTML5 Location Mode
angular.module('main')
    .config(['$locationProvider', '$httpProvider',
        function ($locationProvider, $httpProvider) {

            $locationProvider.hashPrefix('!');

            $httpProvider.interceptors.push(function ($window) {
                return {
                    responseError: function (response) {
                        if (response.status === 401) {
                            $window.location = 'index.html#!/login';
                            return;
                        }
                        if (response.status === 403) {
                            $window.location = 'index.html#!/accept_terms';
                            return;
                        }
                        return response;
                    }
                };

            });

        }
    ]);
