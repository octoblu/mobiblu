'use strict';

angular.module('main.system').controller('ActivityCtrl',
    function ($rootScope, $scope, $routeParams) {

        $scope.errors = [];

        $rootScope.$emit('togglebackbtn', true);

        $scope.activities = [];

        $scope.limit = 25;

        var setActivity = function () {
            setTimeout(function () {
                $scope.$apply(function () {
                    $scope.activities = $rootScope.Skynet.getActivity($routeParams.pluginName, $scope.limit);
                });
            }, 0);
        };

        $scope.init = function () {
            if ($rootScope.matchRoute('/$')) {
                $scope.limit = 5;
            } else if ($rootScope.matchRoute('/plugins')) {
                $scope.limit = 10;
            }
            $rootScope.ready(function () {
                $rootScope.Skynet.clearActivityCount();
                $scope.activities = $rootScope.Skynet.getActivity($routeParams.pluginName, $scope.limit);
                $(document).on('skynetactivity', function () {
                    setActivity();
                });
            });
        };

    });