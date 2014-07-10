'use strict';

$(document).ready(function(){
    $(document).one('skynet-loaded', function(){
        if(window.octobluMobile){
            window.octobluMobile.init()
                .then(function(){
                    console.log('Plugins Loaded');
                    $(document).trigger('plugins-loaded');
                }, function(){
                    console.log('Error Initializing Plugins');
                });
        }
    });
});
