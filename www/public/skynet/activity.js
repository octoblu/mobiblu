'use strict';

var obj = {};

obj.getActivity = function(){
    var activity = [];
    try{
        activity = JSON.parse(window.localStorage.getItem('skynetactivity'));
    }catch(e){

    }
    //console.log('Activity', JSON.stringify(activity));
    return activity;
};

obj.clearActivityCount = function(){
    obj.x = 0;
    obj.sensActBadge.text(obj.x.toString());
    obj.sensActBadge.removeClass('badge-negative');
    window.localStorage.setItem('activitycount', obj.x);
};

obj.logActivity = function(data){
    if( !obj.skynetActivity ||
        !_.isArray(obj.skynetActivity) )
        obj.skynetActivity = [];
    obj.skynetActivity = obj.skynetActivity.slice(0, 50);

    if(obj.skynetActivity.length)
        obj.skynetActivity.unshift(data);
    else
        obj.skynetActivity.push(data);

    if(data.error){
        obj.sensActBadge.text('Error');
        obj.sensActBadge.addClass('badge-negative');
    }else{
        obj.x++;
        obj.sensActBadge.text(obj.x.toString() + ' New');
        obj.sensActBadge.removeClass('badge-negative');
    }

    var string = JSON.stringify(obj.skynetActivity);

    window.localStorage.setItem('skynetactivity', string);
    window.localStorage.setItem('activitycount', obj.x);
    $(document).trigger('skynetactivity', true);
};

obj.init = function(){
    obj.sensActBadge = $('#sensor-activity-badge'),
        obj.x = window.localStorage.getItem('activitycount') || 0;
    obj.skynetActivity = obj.getActivity();
};



module.exports = obj;