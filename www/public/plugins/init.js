'use strict';

$(document).ready(function(){
    $(document).on('octoblu-loaded', function(){
        require('./index.js').init();
    });
});
