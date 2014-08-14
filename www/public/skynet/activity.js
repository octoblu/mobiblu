'use strict';

var Labels = require('./labels.js');

var obj = {};

var limit = 100;

obj.getActivity = function(type, limit){

    var activity = window.mobibluStorage.getItem('skynetactivity') || [];

    if(!activity){
        return [];
    }

    if(type){
        activity = _.filter(activity, { type : type });
    }
    if(limit){
        activity = activity.slice(0, limit);
    }
    //console.log('Activity', JSON.stringify(activity));
    return activity;

};

obj.clearActivityCount = function(){
    obj.x = 0;
    obj.sensActBadge.text(obj.x.toString());
    obj.sensActBadge.removeClass('badge-negative');
    window.mobibluStorage.setItem('activitycount', obj.x);
};

obj.logActivity = function(data){
    Labels.getLabel(data.type)
        .then(function(type){
            data.type = type;

            if( !obj.skynetActivity ||
                !_.isArray(obj.skynetActivity) )
                obj.skynetActivity = [];
            obj.skynetActivity = obj.skynetActivity.slice(0, limit);

            data = _.extend({
                date : new Date()
            }, data);

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

            window.mobibluStorage.setItem('skynetactivity', obj.skynetActivity);
            window.mobibluStorage.setItem('activitycount', obj.x);
            $(document).trigger('skynetactivity', data);

        });
};

obj.init = function(){

    obj.sensActBadge = $('#sensor-activity-badge'),
    obj.x = window.mobibluStorage.getItem('activitycount') || 0;
    obj.skynetActivity = obj.getActivity();

};



module.exports = obj;