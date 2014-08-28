'use strict';

describe('FlowCtrl', function() {
 	var flows;

 	beforeEach(function(){
 		flows = window.Skynet.Topics;
 	});
 	it('should return default flows', function() {
    var topics = flows.getAll();
    expect(topics[0].name).toEqual('Flow Preset A');
    expect(topics[1].name).toEqual('Flow Preset B');
  });
});
