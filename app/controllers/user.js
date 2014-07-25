'use strict';

angular.module('main.user')
    .controller('UserCtrl', function ($rootScope, $scope, $location, $timeout, Auth) {

        $scope.signup = false;

        $scope.user = {};

        $scope.init = function(){
            $scope.error = '';
        };

        $scope.loginViaProvider = function(provider){
            $rootScope.loading = true;
            window.open('http://app.octoblu.com/auth/' + provider + '?js=1&referrer=' + encodeURIComponent('http://localhost/index.html#!/set'), '_self', 'location=yes');
        };

        $scope.loginMethod = function(){
            $rootScope.loading = true;
            Auth.login($scope.user.email, $scope.user.password)
                .then(function(){
                    $rootScope.skynetInit();
                    $timeout(function(){
                        $scope.error = '';
                        $rootScope.loading = false;
                        $location.path('/');
                    }, 0);
                }, function(err){
                    console.log('Error', err);
                    $timeout(function(){
                        $scope.error = 'Error logging in!';
                        $rootScope.loading = false;
                    }, 0);
                });
        };

        $scope.signupMethod = function(){

            console.log('Signup Method');

            if(!$scope.user.password || !$scope.user.password.length){
                $scope.error = 'Must have password';
                console.log($scope.error);
                return;
            }

            if(!$scope.user.email || !$scope.user.email.length){
                $scope.error = 'Must have email';
                console.log($scope.error);
                return;
            }

            if($scope.user.confirm_password !== $scope.user.password){
                $scope.error = 'Passwords Don\'t Match';
                console.log($scope.error);
                return;
            }

            $scope.loading = true;

            Auth.signup($scope.user.email, $scope.user.password)
                .then(function(){
                    console.log('Signed up');
                    $scope.error = '';
                    $scope.loading = false;
                    $rootScope.skynetInit();
                    $timeout(function(){
                        $location.path('/');
                    }, 0);
                }, function(err){
                    console.log('Error', err);
                    $scope.error = 'Error logging in!';
                });
        };

        $scope.hideSignup = function(){
            $scope.signup = false;
        };

        $scope.showSignup = function(){
            $scope.signup = true;
        };

        $scope.acceptTerms = function(){
            Auth.acceptTerms()
                .then(function(){
                    $location.path('/');
                }, function(){
                    alert('Error');
                });
        };

    });
