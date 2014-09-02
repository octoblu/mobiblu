'use strict';

describe('FlowCtrl', function() {
 	var flows, scope;

 	beforeEach(function(){
 		flows = window.Skynet.Topics;
 		flows.clear();
 	});
 	beforeEach(angular.mock.module('main'));
 	beforeEach(angular.mock.inject(function($rootScope, $controller){
    scope = $rootScope.$new();
    $controller('FlowCtrl', {$scope: scope});
  }));

 	it('should return default flows', function() {
    var topics = flows.getAll();
    expect(topics[0].name).toEqual('Flow Preset A');
    expect(topics[1].name).toEqual('Flow Preset B');
  });
  it('should save flow', function(){
  	var flow = {
  		id : '1234567890-1234567890',
  		name : 'Test Created Flow',
  		wait : false,
  		payload : 'Cheeseburger'
  	};
  	var newFlow = flows.save(flow);
  	expect(newFlow.id).toEqual(flow.id);
  });
  it('should return new flow', function(){
  	var topics = flows.getAll();
  	expect(topics.length).toEqual(3);
  });
});
