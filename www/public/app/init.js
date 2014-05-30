'use strict';

document.addEventListener('deviceready', function(){
    //Fixing facebook bug with redirect
    if (window.location.hash === '#_=_') window.location.hash = '#!';

    //Then init the app
    angular.bootstrap(document, ['main']);
}, false);
