'use strict';

angular.module('main.flows')
    .controller('FlowCtrl', function ($rootScope, $location, $scope, $timeout, $routeParams) {

        if ($rootScope.matchRoute('/flows$')) {
            $rootScope.$emit('togglebackbtn', false);
        } else {
            $rootScope.$emit('togglebackbtn', true);
        }

        $scope.topics = [
            {
                id: 1,
                name: 'Flow Preset A',
                wait: false,
                payload: false
            },
            {
                id: 2,
                name: 'Flow Preset B',
                wait: false,
                payload: false
            }
        ];

        $scope.init = function () {

        };

        $scope.triggerTopic = function (topic) {
            $scope.loading = true;

            var index = _.findIndex($scope.topics, topic);

            var done = function (i) {
                $timeout(function () {
                    $scope.topics[i].sent = true;
                    $scope.loading = false;
                }, 0);
            };

            topic.sent = false;
            $scope.topic = topic;

            var defaultPayload = new Date(),
                name = $scope.topic.name;

            var promise = $rootScope.Skynet
                .triggerTopic(name,
                    $scope.topic.payload || defaultPayload);

            if ($scope.topic.wait) {
                promise.timeout(60 * 1000);
            }

            promise.then(function () {
                $rootScope.Skynet.logActivity({
                    type: 'flows',
                    html: 'Topic "' + name + '" Triggered'
                });
                done(index);
            }, $rootScope.redirectToError);


            if (!$scope.topic.wait) {
                done(index);
            }
        };

        $scope.goToFlow = function(flow){
            $location.path('/flows/' + flow.id);
        };

        $scope.findOne = function () {

            var index = _.findIndex($scope.topics, { id: $routeParams.flowId });

            $scope.topic = $scope.topics[index];

        };

        $scope.save = function(){

        };


    });
