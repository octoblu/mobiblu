angular.module('main')
    .directive('compass', function () {
        return {
            restrict: 'AE',
            templateUrl: '/public/angular/directives/compass/compass.html',
            scope: {
                heading : '='
            },
            link: function (scope, element) {
                var el = element.find('.compass'),
                    offset = -45;
                scope.$watch('heading', function(heading){
                    if(!el) return;
                    var deg = Math.round(heading * 100) / 100;
                    var compass = deg + offset;
                    el.css({
                        '-webkit-transform': 'rotate(' + compass + 'deg)',
                        '-moz-transform': 'rotate(' + compass + 'deg)',
                        'transform': 'rotate(' + compass + 'deg)'
                    });
                });
            }
        };
    });
