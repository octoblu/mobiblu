'use strict';

$(document).ready(function(){
    $(document).on('skynet-loaded', initPlugins);

    function initPlugins(){
        if(window.octobluMobile){
            window.octobluMobile.init()
                .then(function(){
                    console.log('Plugins Initd');
                    $(document).trigger('plugins-loaded');
                }, function(){
                    console.log('Error Initializing Plugins');
                });
        }
    }
});