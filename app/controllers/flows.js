'use strict';

var flowsApp = angular.module('main.flows', ['hmTouchevents', 'SkynetModel']);

flowsApp.controller('FlowCtrl', function ($rootScope, $scope, $timeout) {

    if(/\#\!\/flows\/*$/.test(window.location.href)){
        $rootScope.$emit('togglebackbtn', false);
    }else{
        $rootScope.$emit('togglebackbtn', true);
    }

    $scope.topics = [
        {
            name : 'Flow Preset A'
        },
        {
            name : 'Flow Preset B'
        }
    ];

    $scope.init = function(){

    };

    $scope.triggerTopic = function(topic){
        var index = _.findIndex($scope.topics, topic);
        $scope.loading = true;
        topic.sent = false;
        $scope.topic = topic;
        var payload = new Date(),
            name = $scope.topic.name;
        $rootScope.Skynet
            .triggerTopic(name, payload)
            .then(function(){
                $rootScope.Skynet.logActivity({
                    type : 'Skynet Flows',
                    html : 'Topic "' + name + '" Triggered'
                });
                $scope.$apply(function(){
                    $scope.topics[index].sent = true;
                    $scope.loading = false;
                });
                $timeout(function(){
                    $scope.topics[index].sent = false;
                }, 5000);
            }, $rootScope.redirectToError);
    };


});
