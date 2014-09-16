'use strict';

angular.module('main.plugins')
    .service('Subdevices', function ($window) {

        var service = {},
            subdevices = [];

        service.retrieve = function(){
            return subdevices.length ? subdevices : $window.mobibluStorage.getItem('subdevices');
        };

        service.each = function(cb){
            _.each(subdevices, cb);
        };

        service.write = function(_subdevices){
            if(_subdevices){
                subdevices = _subdevices;
            }
            console.log('Writing Subdevices', JSON.stringify(subdevices));
            $window.mobibluStorage.setItem('subdevices', subdevices);
            return subdevices;
        };

        return service;

    });