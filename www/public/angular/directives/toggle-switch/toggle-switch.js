angular.module('main')
    .directive('toggleSwitch', function () {
        return {
            restrict: 'AE',
            templateUrl: '/public/angular/directives/toggle-switch/toggle-switch.html',
            scope: {
                model: '=',
                change: '='
            },
            link: function (scope) {
                scope.toggleSwitch = function () {
                    scope.model = scope.model ? false : true;
                    if(scope.change && typeof scope.change === 'function'){
                        scope.change(scope.model);
                    }
                };
            }
        };
    });
