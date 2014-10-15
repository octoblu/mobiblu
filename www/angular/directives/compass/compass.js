angular.module('main')
    .directive('compass', function () {
        return {
            restrict: 'AE',
            templateUrl: '/angular/directives/compass/compass.html',
            scope: {
                heading : '='
            },
            link: function (scope, element) {
                var el = element.find('.compass'),
                    offset = -45;
                scope.$watch('heading', function(heading){
                    if(!el) return;
                    scope.heading = Math.round(heading * 100) / 100;
                    var compass = scope.heading + offset;
                    el.css({
                        '-webkit-transform': 'rotate(' + compass + 'deg)',
                        '-moz-transform': 'rotate(' + compass + 'deg)',
                        'transform': 'rotate(' + compass + 'deg)'
                    });
                });
            }
        };
    });
