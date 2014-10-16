'use strict';

angular.module('main.flows')
    .controller('FlowCtrl', function ($rootScope, $q, $location, $scope, $timeout, $routeParams, Flows, Skynet, Activity) {

        var wait = false;

        function getFlows(){
            return Flows.getFlows()
                .then(function(res){
                    var deferred = $q.defer();
                    var flows = res.data;
                    $rootScope.loading = false;
                    $scope.flows = _.filter(flows, function(flow){
                        return _.findWhere(flow.nodes, { type : 'operation:trigger' });
                    });
                    var combinedFlows = [];
                    _.each(flows, function(flow){
                        combinedFlows.push({type : 'flow', object : flow});
                        var triggers = _.filter(flow.nodes, { type : 'operation:trigger' });

                        triggers = _.map(triggers, function(trigger){
                            return {type : 'trigger', object : trigger, flow : flow};
                        });
                        combinedFlows = combinedFlows.concat(triggers);
                    });

                    $scope.combinedFlows = combinedFlows;
                    deferred.resolve();
                    return deferred.promise;
                });
        }

        $rootScope.loading = true;

        getFlows();

        $scope.init = function () {
            // Do something?
        };


        $scope.triggerButton = function (button) {
            var index = _.findIndex($scope.combinedFlows, function(obj){
                return obj.type === 'trigger' && obj.object.id === button.id;
            });

            var flow = $scope.combinedFlows[index].flow;

            function markSent() {
                $scope.loading = false;

                Activity.logActivity({
                    type: 'flows',
                    html: 'Flow "' + flow.name + '" Triggered'
                });

                $timeout(function(){
                    $scope.combinedFlows[index].sending = false;
                }, 10);
            }

            $scope.loading = true;

            var start = new Date().getTime();

            $scope.combinedFlows[index].sending = true;

            if (!wait) {
                markSent();
            }

            Skynet.message({
                devices : flow.flowId,
                topic : 'button',
                payload : {
                    from : button.id
                }
            })
            .then(function (data) {

                if (wait) {

                    var end = new Date().getTime();
                    var response;

                    if (/^timeout/.test(data.error)) {
                        response = 'No response received';
                    } else {
                        response = JSON.stringify(data);
                    }

                    $scope.$apply(function(){
                        $rootScope.alertModal('Response - ' + (end - start) + ' ms', response);
                        markSent();
                    });

                }

            }, $rootScope.redirectToError);

        };

        $scope.goToFlow = function (flowId) {
            console.log('Going to flow: ' + flowId);
            $location.path('/flows/' + flowId);
        };

    });
