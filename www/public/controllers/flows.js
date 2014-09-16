'use strict';

angular.module('main.flows')
    .controller('FlowCtrl', function ($rootScope, $q, $location, $scope, $timeout, $routeParams, Flows, Skynet) {

        var wait = false;

        function getFlows(){
            return Flows.getFlows()
                .then(function(res){
                    var deferred = $q.defer();
                    var flows = res.data;
                    $rootScope.loading = false;
                    $scope.flows = _.filter(flows, function(flow){
                        return _.findWhere(flow.nodes, { type : 'button' });
                    });
                    deferred.resolve();
                    return deferred.promise;
                });
        }

        $scope.init = function () {
            $rootScope.loading = true;
            getFlows();
        };


        $scope.triggerButton = function (button) {
            var index = _.findIndex($scope.flow.nodes, { id : button.id });

            function markSent() {
                $scope.loading = false;

                Skynet.logActivity({
                    type: 'flows',
                    html: 'Flow button "' + $scope.flow.name + '" Triggered'
                });

                $timeout(function(){
                    $scope.flow.nodes[index].sending = false;
                }, 10);
            }

            $scope.loading = true;

            var start = new Date().getTime();

            $scope.flow.nodes[index].sending = true;

            if (!wait) {
                markSent();
            }

            Skynet.message({
                devices : $scope.flow.flowId,
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

        $scope.findOne = function () {
            console.log('Flow ID ', $routeParams.flowId);
            getFlows().then(function(){
                $scope.flow = _.findWhere($scope.flows, { flowId : $routeParams.flowId });

                $scope.flow.nodes = _.filter($scope.flow.nodes, { type : 'button' });

            });
        };

    });
