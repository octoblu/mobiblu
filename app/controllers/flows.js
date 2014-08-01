'use strict';

angular.module('main.flows')
    .controller('FlowCtrl', function ($rootScope, $location, $scope, $timeout, $routeParams, Topic) {

        if ($rootScope.matchRoute('/flows$')) {
            $rootScope.$emit('togglebackbtn', false);
        } else {
            $rootScope.$emit('togglebackbtn', true);
        }

        $scope.init = function () {

            $scope.topics = Topic.getAll();

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

            var start = new Date().getTime();

            var promise = $rootScope.Skynet
                .triggerTopic(name,
                    $scope.topic.payload || defaultPayload);

            promise.then(function (data) {
                $rootScope.Skynet.logActivity({
                    type: 'flows',
                    html: 'Topic "' + name + '" Triggered'
                });
                if ($scope.topic.wait) {
                    var end = new Date().getTime();
                    var response;

                    if (/^timeout/.test(data.error)) {
                        response = 'No response received';
                    } else {
                        response = JSON.stringify(data);
                    }

                    $rootScope.alertModal('Response - ' + (end - start) + ' ms', response);
                    done(index);
                }
            }, $rootScope.redirectToError);

            if (!$scope.topic.wait) {
                done(index);
            }
        };

        $scope.goToTopic = function (topic) {
            $location.path('/flows/' + topic.id);
        };

        $scope.findOne = function () {
            console.log('Flow ID ', $routeParams.flowId);
            $scope.topic = Topic.get($routeParams.flowId);
        };

        $scope.save = function () {
            $scope.topic = Topic.save($scope.topic);
            $location.path('/flows');
        };

        $scope.deleteTopic = function () {
            Topic.delete($scope.topic);
            $location.path('/flows');
        };

        $scope.createTopic = function () {
            $location.path('/flows/' + createID());
        };

    });
