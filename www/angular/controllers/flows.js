'use strict';

angular.module('main.flows')
  .controller('FlowCtrl', function($rootScope, $q, $location, $scope, $timeout, $routeParams, FlowDeploy, Flows, Skynet, Activity) {

    var wait = false, myDevices = [];

    function updateOnlineStatus(uuid, online){
    	var index = _.findIndex($scope.combinedFlows, function(obj) {
        return obj.type === 'flow' && obj.object.flowId === uuid;
      });
    	if ($scope.combinedFlows[index]) {
    		$scope.combinedFlows[index].loadingStatus = false;
        $scope.combinedFlows[index].online = online;
      }
    }

    function startListening(conn){
    	conn.on('message', function (message) {
      	var triggerIndex;
        if (message.topic === 'device-status') {
        	updateOnlineStatus(message.fromUuid, message.payload.online);
        	$scope.$apply();
        }else if(message.topic === 'button'){
        	triggerIndex = _.findIndex($scope.combinedFlows, function(obj) {
		        return obj.type === 'trigger' && obj.object.id === message.payload.from;
		      });

        	$scope.combinedFlows[triggerIndex].sending = true;
        	$scope.$apply();

        	$timeout(function(){
	        	$scope.combinedFlows[triggerIndex].sending = false;
        	}, 10);
        }
      });
    }

    function getFlowsStatus(){
    	var deferred = $q.defer();
    	Skynet.ready().then(function (conn) {
	      conn.mydevices({}, function(result){
	      	myDevices = result.devices || [];
	        _.each(myDevices, function(device){
	        	// Subscribe to Flow
	  	      conn.subscribe({uuid: device.uuid, type: 'octoblu:flow', topic: 'pulse'});
	  	      // Update Online Status
	        	updateOnlineStatus(device.uuid, device.online);
	        });

	        deferred.resolve();

	        $scope.$apply();
	      });
	      startListening(conn);
	    });

	    return deferred.promise;
    }

    function combineFlows(flows){
    	var newCombinedFlows = [];
    	_.each(flows, function(flow) {
    		flow.loadingStatus = true;
        newCombinedFlows.push({
          type: 'flow',
          object: flow
        });
        var triggers = _.filter(flow.nodes, {
          type: 'operation:trigger'
        });

        triggers = _.map(triggers, function(trigger) {
          return {
            type: 'trigger',
            object: trigger,
            flow: flow
          };
        });
        newCombinedFlows = newCombinedFlows.concat(triggers);

      });
      return newCombinedFlows;
    }

    function getFlows() {
      return Flows.getFlows()
        .then(function(res) {
          var deferred = $q.defer();
          var flows = res.data;
          $rootScope.loading = false;
          $scope.flows = flows;

          $scope.combinedFlows = combineFlows(flows);
          deferred.resolve();
          return deferred.promise;
        })
        .then(getFlowsStatus());
    }

    $rootScope.loading = true;

    getFlows();

    $scope.init = function() {
      // Do something?
    };

    $scope.triggerButton = function(button) {
      var index = _.findIndex($scope.combinedFlows, function(obj) {
        return obj.type === 'trigger' && obj.object.id === button.id;
      });

      var flow = $scope.combinedFlows[index].flow;

      function markSent() {
        $scope.loading = false;

        Activity.logActivity({
          type: 'flows',
          html: 'Flow "' + flow.name + '" Triggered'
        });
      }

      $scope.loading = true;

      var start = new Date().getTime();

      if (!wait) {
        markSent();
      }

      Skynet.message({
        devices: flow.flowId,
        topic: 'button',
        payload: {
          from: button.id
        }
      }).then(function(data) {

        if (!wait) return;

        var end = new Date().getTime();
        var response;

        if (/^timeout/.test(data.error)) {
          response = 'No response received';
        } else {
          response = JSON.stringify(data);
        }

        $timeout(function() {
          $rootScope.alertModal('Response - ' + (end - start) + ' ms', response);
          markSent();
        }, 0);

      }, $rootScope.redirectToError);

    };

    $scope.controlFlow = function(command, flow){
    	var key = command + 'ing';
    	flow[key] = true;
    	FlowDeploy.controlFlow(command, flow.object.flowId)
    		.then(function(){
     			flow[key] = false;
    		}, function(err){
    			console.log('Error', err);
    			flow[key] = false;
    		});
    };

    $scope.$on('$destroy', function(){
    	Skynet.ready().then(function(conn){
    		_.each(myDevices || [], function(device){
	      	// Unsubscribe to flow
		      conn.unsubscribe({uuid: device.uuid, type: 'octoblu:flow', topic: 'pulse'});
	      });
    	});
    });

  });