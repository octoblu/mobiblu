'use strict';

angular.module('main.flows')
    .controller('FlowCtrl', function ($rootScope, $location, $scope, $timeout, $routeParams, Topic) {

        if ($rootScope.matchRoute('/flows$')) {
            $rootScope.$emit('togglebackbtn', false);
        } else {
            $rootScope.$emit('togglebackbtn', true);
        }

        $scope.defaultTopics = [
            {
                id: 'a12319b-5d4f-ad87-a90a-198e92833335',
                name: 'Flow Preset A',
                wait: false,
                payload: ''
            },
            {
                id: 'a112di9b-5dsf-ad82-a90a-198e928123335',
                name: 'Flow Preset B',
                wait: false,
                payload: ''
            }
        ];

        $scope.init = function () {

            $scope.topics = Topic.getAll();

            _.each($scope.defaultTopics, function(topic){
                Topic.save(topic);
            });
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

            promise.then(function (data) {
                $rootScope.Skynet.logActivity({
                    type: 'flows',
                    html: 'Topic "' + name + '" Triggered'
                });
                if ($scope.topic.wait) {
                    alert(JSON.stringify(data));
                    done(index);
                }
            }, $rootScope.redirectToError);


            if (!$scope.topic.wait) {
                done(index);
            }
        };

        $scope.goToTopic = function(topic){
            $location.path('/flows/' + topic.id);
        };

        $scope.findOne = function () {
            console.log('Flow ID ', $routeParams.flowId);
            $scope.topic = Topic.get($routeParams.flowId);
        };

        $scope.save = function(){
            $scope.topic = Topic.save($scope.topic);
            $location.path('/flows');
        };

        $scope.deleteTopic = function(){
            Topic.delete($scope.topic);
            $location.path('/flows');
        };

        $scope.createTopic = function(){
            $location.path('/flows/' + createID());
        };

    });
