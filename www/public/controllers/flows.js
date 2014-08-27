'use strict';

angular.module('main.flows')
    .controller('FlowCtrl', function ($rootScope, $location, $scope, $timeout, $routeParams, Topic) {

        var timeouts = {};

        if ($rootScope.matchRoute('/flows$')) {
            $rootScope.$emit('togglebackbtn', false);
        } else {
            $rootScope.$emit('togglebackbtn', true);
        }

        $scope.init = function () {

            $scope.topics = Topic.getAll();

        };

        function markSent(id) {
            var index = _.findIndex($scope.topics, { id: id });
            $timeout(function () {
                $scope.topics[index].sent = false;
                $scope.loading = false;
            }, 0);
        }

        $scope.triggerTopic = function (topic) {
            $scope.loading = true;

            topic.sent = true;
            $scope.topic = topic;

            var defaultPayload = new Date(),
                name = $scope.topic.name;

            var start = new Date().getTime();

            var id = $scope.topic.id;

            if (typeof timeouts[id] === 'function') {
                $timeout.clear(timeouts[id]);
                delete timeouts[id];
            }

            function setSentTimeout(id){
                timeouts[id] = $timeout(function () {
                        markSent(id);
                    }, 5000);
            }

            if (!$scope.topic.wait) {
                setSentTimeout(id);
                $scope.loading = false;
            }

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

                    $scope.$apply(function(){
                        $rootScope.alertModal('Response - ' + (end - start) + ' ms', response);
                    });

                    setSentTimeout(id);

                }

            }, $rootScope.redirectToError);

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
            $location.path('/flows/' + utils.createID());
        };

    });
