'use strict';

angular.module('main.system').controller('ErrorCtrl',
    function ($rootScope, $scope, Skynet, $location) {

        $scope.init = function () {
            console.log('On Error Page', $rootScope.errorMsg);
            if (!$rootScope.errorMsg) {
                return $rootScope.errorMsg = '';
            }
            if (typeof $rootScope.errorMsg !== 'string') {
                $rootScope.errorMsg = $rootScope.errorMsg.toString();
            }
        };

        $scope.logout = function () {
            Skynet.logout();
        };

        $scope.refresh = function(){
            $location.path('/');
            window.location.reload(true);
        };

    });