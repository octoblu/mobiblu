angular.module('main')
    .directive('toggleSwitch', function () {
        return {
            restrict: 'AE',
            templateUrl: '/angular/directives/toggle-switch/toggle-switch.html',
            scope: {
                model: '=',
                change: '=',
                key: '='
            },
            link: function (scope) {
                scope.toggleSwitch = function () {
                    scope.model = scope.model ? false : true;
                    if(scope.change && typeof scope.change === 'function'){
                        scope.change(scope.model, scope.key);
                    }
                };
            }
        };
    });
