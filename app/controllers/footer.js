'use strict';

angular.module('main.system').controller('FooterCtrl', ['$scope', '$routeParams', '$location', '$http',
    function ($scope) {
        $scope.isActive = function(route){
            var regex = new RegExp('\\#\\!' + route + '$');
            if(window.location.href.match(regex)){
                return true;
            }
            return false;
        };
    }
]);
