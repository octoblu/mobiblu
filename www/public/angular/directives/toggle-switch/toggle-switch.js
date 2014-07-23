angular.module('main')
    .directive('toggleSwitch', function () {
        return {
            restrict: 'AE',
            templateUrl: '/public/angular/directives/toggle-switch/toggle-switch.html',
            scope: {
                model: '='
            },
            link: function (scope) {
                scope.toggleSwitch = function () {
                    scope.model = !scope.model;
                };
            }
        };
    });
